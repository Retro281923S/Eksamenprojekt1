var http = require("http");
var fs = require("fs");
const path = require('path'); 

let writeHeadCustom = ((res, statusCode, mime_type) => {
    console.log(mime_type);
    res.writeHead(statusCode, mime_type);
    /*if (req.url.endsWith(".htm"))
        res.writeHead(200, { 'Content-Type': "text/html" });
    else if (req.url.endsWith(".svg")) {
        res.writeHead(200, { 'Content-Type': "image/svg+xml" });
    }
    else if (req.url.endsWith(".webp")) {
        res.writeHead(200, { 'Content-Type': "image/webp" });
    }
    else if (req.url.endsWith(".css")) {
        res.writeHead(200, { 'Content-Type': "text/css" });
    }*/
});

listener = ((req, res) => {
    if (req.url.endsWith("/"))
        req.url = req.url + "index.htm";
    else if (/\/[A-Za-z_æøåÆØÅ0-9]+$/.test(req.url)){
        req.url = req.url + "/index.htm";
    }

    /* MIME types from: https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types */
    let mime_type = "text/html";
    if (req.url.endsWith(".htm"))
        mime_type = { 'Content-Type': "text/html" };
    else if (req.url.endsWith(".svg")) {
        mime_type = { 'Content-Type': "image/svg+xml" };
    }
    else if (req.url.endsWith(".webp")) {
        mime_type = { 'Content-Type': "image/webp" };
    }
    else if (req.url.endsWith(".css")) {
        mime_type = { 'Content-Type': "text/css" };
    }

    handlePath(req, res, path.join(__dirname, "contents", req.url.replace(/^(\.\.)+/, '')), mime_type);
});

class ErrorMessages {
    constructor(_res, _mime_type){
        this.warnings = [];
        this.errors = [];
        this.res = _res;
        this.mime_type = _mime_type;
    }

    _handle_warning_and_errors(res = this.res){
        if (this.warnings.length == 0 && this.errors.length == 0)
            return false;
    
        let str = "";
        if (this.warnings.length != 0){
            str += this.color("yellow", "Warning" + (this.warnings.length == 1 ? "" : "s") + ":\n");
            for (const warning of this.warnings){
                str += this.color("yellow", warning) + "\n";
            }
            str = str.substring(0, str.length-1);
        }
        if (this.errors.length != 0){
            str += this.color("red", "Error" + (this.warnings.length == 1 ? "" : "s") + ":\n");
            for (const error of this.errors){
                str += this.color("red", error) + "\n";
            }
            str = str.substring(0, str.length-1);
        }
        console.log(str);

        if (this.errors.length != 0){
            writeHeadCustom(res, 500, this.mime_type); 
            res.end(str.replaceAll("\x1b[33m", "<p style='color:yellow'>")
                       .replaceAll("\x1b[0m", "</p>")
                       .replaceAll("\x1b[90m", "<p style='color:gray'>")
                       .replaceAll("\x1b[31m", "<p style='color:red'>"));
            return true;
        }
        return false;
    }

    _handle_error(error_msg, res = this.res){
        this.errors.push(error_msg);
        return this._handle_warning_and_errors(res);
    }

    color(color, text){
        if (color == "yellow")
            return "\x1b[33m" + text + "\x1b[0m";
        else if (color == "red")
            return "\x1b[31m" + text + "\x1b[0m";
        else if (color == "gray")
            return "\x1b[90m" + text + "\x1b[0m";
        console.error("\x1b[31mCOLOR NOT FOUND!\x1b[0m");
        return "\x1b[31m" + text + "\x1b[0m";
    }
}

class RequestedFile extends ErrorMessages {
    structure_dir_path = null;
    structure_file_path = null;
    structure_type = null;

    constructor(_path, _safe_path, _basename, _type, _dirpath, _req, _res, _mime_type) {
        super(_res, _mime_type);
        this.path = _path;
        this.safe_path = _safe_path; 
        this.basename = _basename;
        this.type = _type;
        this.dirpath = _dirpath;
        this.contents_root = path.join(__dirname, "contents")
        this.req = _req;
        this.res = _res;
        this.mime_type = _mime_type;
    }

    handle_warning_and_errors(res = this.res) {
        let boolval = super._handle_warning_and_errors(res);
        if (boolval){
            this.log();
            return true;
        }
        return false;
    }
    
    handle_error(error_msg, res = this.res){
        if (super._handle_error(error_msg, res))
            this.log();
    }

    setStructure(_structure_dir_path, _structure_file_path, _structure_type){
        this.structure_dir_path = _structure_dir_path;
        this.structure_file_path = _structure_file_path;
        this.structure_type = _structure_type;
    }

    log(){
        // console.log("\n--- Debug printing information reguarding file request: ---");
        console.log(super.color("gray", "this.path:\t"), this.path);
        console.log(super.color("gray", "this.safe_path:\t"), this.safe_path);
        console.log(super.color("gray", "this.basename:\t"), this.basename);
        console.log(super.color("gray", "this.type:\t"), this.type);
        console.log(super.color("gray", "this.dirpath:\t"), this.dirpath);
        console.log(super.color("gray", "this.contents_root:\t"), this.contents_root);
        console.log(super.color("gray", "this.reg & res:\t") + " Objects contaning req & res from http.createServer")
        console.log(super.color("gray", "this.warnings:\t") + " List<string> of warnings")
        console.log(super.color("gray", "this.errors:\t") + " List<string> of errors", "\n")
    }

    console_print_request_start(){
        console.log("--- Request START (" + this.basename + ") ---");
    }

    console_print_request_end(){
        console.log("--- Request END   (" + this.basename + ") ---\n");
    }
}

let handlePath = ((req, res, _path, mime_type) => {
    let fileMeta;
    {
        let safe_path = path.join(_path.replace(/^(\.\.)+/, '')); 
        let basename = path.basename(safe_path);
        let type = path.extname(safe_path);
        let dirpath = path.dirname(safe_path);
        fileMeta = new RequestedFile(_path, safe_path, basename, type, dirpath, req, res, mime_type);
    }

    fileMeta.console_print_request_start();

    if (fileMeta.basename == "favicon.ico"){
        fileMeta.warnings.push("favicon.ico does not exist!");
        fileMeta.handle_warning_and_errors();
        fileMeta.console_print_request_end();
        return;
    }

    //fileMeta.log();
    //let type = basename.match("\.([^\.]+)$")[1]; // First capture group
    //console.log(req.url, fileMeta.safe_path, fileMeta.basename, fileMeta.dirpath, fileMeta.type);

    let stats;
    try {
        stats = fs.statSync(fileMeta.safe_path);
    } catch(e) {
        fileMeta.handle_error("Path does not exist '" + fileMeta.safe_path + "'");
        fileMeta.console_print_request_end();
        return;
    }

    if (stats.isFile(fileMeta.safe_path)){
        if (fileMeta.type != ".structure"){
            if (fileMeta.basename == "index.htm"){
                if (searchForStructure(fileMeta, fileMeta.dirpath) != true)
                    return;

                buildStructure(fileMeta, fileMeta.structure_dir_path, fileMeta.structure_type).then((data_str) => {
                    if (fileMeta.handle_warning_and_errors())
                        writeHeadCustom(res, 500, "text/html");
                    else (fileMeta.handle_warning_and_errors())
                        writeHeadCustom(res, 200, fileMeta.mime_type);
                    fileMeta.res.write(data_str);
                    fileMeta.console_print_request_end();
                    res.end();
                });
            }
            else {
                if (fileMeta.handle_warning_and_errors())
                    writeHeadCustom(res, 404, "text/html");
                else
                    writeHeadCustom(res, 200, fileMeta.mime_type);
                //console.log(fileMeta.mime_type);
                res.write(fs.readFileSync(fileMeta.safe_path));
                fileMeta.console_print_request_end();
                res.end();
                return;
            }
        }
        else {
            writeHeadCustom(res, 500, "text/plain");
            res.end("Structure file prohibited from being generated: " + fileMeta.safe_path);
        }
    }
});

let searchForStructure = ((fileMeta, currentDir, isFirstDir = true) => {
    let filename = "inherited.structure";
    if (isFirstDir)
        filename = "local.structure";

    let stats;
    try {
        stats = fs.statSync(path.join(currentDir, filename)); // Throws error if file does not exist
    } catch(e) {
        fileMeta.warnings.push("Structure file does not exist. '" + fileMeta.dirpath + path.sep + filename + "'");
        let parentDir = path.resolve(currentDir, "../");
        if (__dirname == parentDir){
            fileMeta.warnings.push("Could not find structure for requested url! (reached project root directory!)");
            fileMeta.handle_warning_and_errors();
            fileMeta.console_print_request_end();
            return;
        }
        if (fileMeta.dirpath == path.join(__dirname, "contents")){
            fileMeta.handle_error("Structure file not found for current HTML file. (recurvsive)");
            fileMeta.console_print_request_end();
            return;
        }

        return searchForStructure(fileMeta, parentDir, false);
    }

    fileMeta.setStructure(currentDir, path.join(currentDir, filename), filename);
    return true;
});

let buildStructure = ((fileMeta, structurePath, structureType) => {
    return new Promise((resolve, reject) => {
        let lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(path.join(structurePath, structureType))
        });

        let file_data_string = "";
    
        let promise = null;
        let handleTagLine = ((matches) => {
            lineReader.pause();
    
            let tagName = matches[1];
            let tagData = matches[2];
    
            if (tagName == "THIS_STRUCTURE"){
                promise = new Promise((resolve, reject) => {
                    return buildStructure(fileMeta, structurePath, "local.structure").then((str) => resolve(str));
                });
            }
            else if (tagName == "FILE"){
                let _path;
                if (tagData.startsWith("/")){
                    _path = path.join(fileMeta.contents_root, tagData.substring(1)); // .structure files are server side and therfor trusted. May contain '..'
                }
                else{
                    _path = path.join(structurePath, tagData);
                }

                send_file(fileMeta, _path, tagName, tagData);
            }
            else if (tagName == "FILE_LOCAL_IF_INHERIT"){
                send_file(fileMeta, path.join(fileMeta.dirpath, tagData), tagName, tagData);
            }
            else if (tagName == "MAIN"){
                send_file(fileMeta, fileMeta.safe_path, tagName, tagData);
            }
            else{
                console.log(matches);
            }
            lineReader.resume();
        });

        let to_user_freindly_string = ((str) => {
            return str.charAt(0).toUpperCase() +
               str.replace("oe", "ø")
               .replaceAll("aa", "a")
               .replaceAll("ae", "æ") 
               .replaceAll("_", " ") 
               .slice(1)
        });

        let handle_special_files = ((file_data, fileMeta, _path, tagName, tagData) => {
            let this_path = fileMeta.dirpath.substring(fileMeta.contents_root.length + 1, fileMeta.contents_root.length + 1 + (fileMeta.dirpath.length - fileMeta.contents_root.length));
            let folders = this_path.split(path.sep);
            if (folders.length == 1 && folders[0] == "")
                folders = [];
            
            let urls = [];

            for (let i = 0; i <= folders.length; i++){
                if (urls.length == 0)
                    urls.push("/");
                else
                    urls.push(urls[i - 1] + folders[i-1] + "/"); // (urls.length == 1 ? "" : "/")
            }

            let str = "<a href='/'>Forside</a>";
            for (let i = 0; i < folders.length; i++){
                str += " / <a href='" + urls[i + 1] + "'>" + to_user_freindly_string(folders[i]) + "</a>";
            }

            let mainMenu = "forside";
            if (folders.length != 0)
                mainMenu = folders[0];

            if (tagData == "/global/header.htm"){
                let content_parts = file_data.split("<body>");
                content_parts[1] = content_parts[1].replace("data-nav-id=\"" + mainMenu + "\"", "data-nav-id=\"" + mainMenu + "\" data-active");
                if (folders.length != 0){
                    content_parts[1] = content_parts[1].replace("<location-box>", "<location-box>" + str);

                    let subNavPath = path.join(fileMeta.contents_root, (folders[0] + path.sep));
                    let dubMenuDom = "";
                    for (const file of fs.readdirSync(subNavPath)){
                        if (fs.statSync(subNavPath + path.sep + file).isDirectory()){
                            dubMenuDom += "<a href='/" + folders[0] + "/" + file + "'" + (((folders.length >= 2) && file == folders[1]) ? " data-active" : "")
                                       + "><vertical-center>" + to_user_freindly_string(file) + "</vertical-center></a>";
                        }
                    }

                    // Sub menu for debug purpeses.
                    let dubMenuDom2 = "";
                    if (folders.length >= 2){
                        let subNavPath = path.join(fileMeta.contents_root, (folders[0] + path.sep + folders[1] + path.sep));
                        for (const file of fs.readdirSync(subNavPath)){
                            if (fs.statSync(subNavPath + file).isDirectory()){
                                dubMenuDom2 += "<a href='/" + folders[0] + "/" + folders[1] + "/" + file + "'" + (((folders.length > 2) && file == folders[2]) ? " data-active" : "")
                                        + "><vertical-center>" + to_user_freindly_string(file) + "</vertical-center></a>";
                            }
                        }
                    }

                    content_parts[1] = content_parts[1].replace("<sub-nav class=\"file-contents-index-hide\">", "<sub-nav class=\"file-contents-index-hide\">"
                                                                + dubMenuDom);
                    content_parts[1] = content_parts[1].replace("<sub-sub-nav class=\"file-contents-index-hide\">", "<sub-sub-nav class=\"file-contents-index-hide\">"
                                                                + dubMenuDom2);
                }

                return content_parts.join("");
            }
            return file_data;
        });

        let send_file = ((fileMeta, _path, tagName, tagData) => {
            if (/^[a-zA-Z0-9_æøåÆØÅ]*$/.test(_path.split(path.sep).pop())){ // If it does not conatin '.'
                send_file(fileMeta, _path + ".htm", tagName, tagData + ".htm");
                send_file(fileMeta, _path + ".css", tagName, tagData + ".css");
                return;
            }
            let stats;
            let path_found = true;
            try {
                stats = fs.statSync(_path);
            } catch(e) {
                path_found = false;
                fileMeta.warnings.push("Path does not exist (for [" + tagName + "] in structure '" + path.join(structurePath, structureType) + "')\n- File not found: '" + _path + "'\n");
            }
        
            if (path_found == true && stats.isFile(_path)){
                if (_path.endsWith(".css")){
                    if (file_data_string.includes("</head>") && tagData != "/global/header.css") {
                        let css_path = _path;
                        css_path = css_path.substring(fileMeta.contents_root.length);
                        css_path = css_path.replaceAll(path.sep, path.posix.sep);
                        file_data_string = file_data_string.replace("</head>", "\t<link rel='stylesheet' href=\"" + css_path + "\">\n</head>");
                    }
                    else {
                        file_data_string = file_data_string.replace("</head>", "\t<style>" + fs.readFileSync(_path, 'utf8') + "</style>\n</head>");
                        // file_data_string += "<style>" + fs.readFileSync(_path, 'utf8') + "</style>";
                    }
                }
                else {
                    let file_data = fs.readFileSync(_path, 'utf8');
                    file_data = handle_special_files(file_data, fileMeta, _path, tagName, tagData);
                    file_data_string += file_data;
                }
            }
        });
        
        lineReader.on('line', (line) => {
            //console.log(line);
            if (line.startsWith("[")){
                let matches = line.match(/^\[([A-Z_]+)\](.*)$/);
                if (matches != null){
                    handleTagLine(matches);
                    //return;
                }
            }
        });

        let beforeClose = (() => {
            let class_name = "file-" + fileMeta.dirpath.split(path.sep).pop() + "-" + fileMeta.basename.substring(0, (fileMeta.basename.length - fileMeta.type.length));
            file_data_string = file_data_string.replace("<head>", "<head>\n\t<style>." + class_name + "-display { display:block; }</style>");
            file_data_string = file_data_string.replace("<head>", "<head>\n\t<style>." + class_name + "-hide { display:none; }</style>");
            let title = fileMeta.dirpath.split(path.sep).pop();
            file_data_string = file_data_string.replace("<head>", "<head><title>" + (title == "contents".toLowerCase() ? "Forside" : to_user_freindly_string(title)) + "</title>");
            if (title == "indmelding"){
                file_data_string = file_data_string.replace('id="signup_btn"', 'id="signup_btn" class="red"');
            }
            return file_data_string;
        });
    
        lineReader.on('close', () => {
            if (promise == null){
                resolve(beforeClose());
            }
            else {
                promise.then((data_str) => {
                    file_data_string = data_str;
                    resolve(file_data_string);
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    });
});

let commentStart = ((type) => {
    if (type == "js" || type == "css")
        return "/***";
    if (type == "htm" || type == "html")
        return "<!--";
});

let commentEnd = ((type) => {
    if (type == "js" || type == "css")
        return "***/";
    if (type == "htm" || type == "html")
        return "-->";
});

server = http.createServer(listener);
server.listen(1337);