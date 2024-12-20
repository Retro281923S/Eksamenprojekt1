var http = require("http");
var fs = require("fs");
const path = require('path'); 

let outputDir = path.join(__dirname, "generated_content" + path.sep);
let inputDir = path.join(__dirname, "contents" + path.sep)
let generateContent = (async (_path) => {
    let fullPathInput = path.join(inputDir, _path);
    let fullPathOutput = path.join(outputDir, _path);
    for (const file of fs.readdirSync(fullPathInput)){
        let fullPathAndBasenameInput = path.join(fullPathInput, file);
        let fullPathAndBasenameOutput = path.join(fullPathOutput, file);
        if (fs.statSync(fullPathInput + path.sep + file).isDirectory()){
            fs.mkdirSync(fullPathAndBasenameOutput);
            generateContent(path.join(_path, file + path.sep));
        }
        else {
            let serverPath = path.posix.sep + fullPathAndBasenameInput.substring(inputDir.length).replaceAll(path.sep, path.posix.sep);
            const req = http.request({hostname: 'localhost', path: serverPath, port: 1337, method: 'GET', timeout: 1000}, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk;
                });
    
                res.on('end', () => {
                    if (res.statusCode == 500){
                        console.log("\x1b[31m" + data + "\x1b[0m");
                        return;
                    }

                    fs.writeFileSync(fullPathAndBasenameOutput, data, 'utf8');
                });
            }).on("error", (e) => {
                console.log("\x1b[31mError: ", e);
                console.log(req, "\x1b[0m");
            }).end();
        }
    }
});

fs.rmSync(outputDir, {recursive: true, force: true});
fs.mkdirSync(outputDir);
generateContent("");