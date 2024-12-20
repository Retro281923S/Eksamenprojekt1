# no-dub
Design to minimize dublications in code with no server side code. Etc. only having the header and footer one place in the code.

## Setup
1. Install [nodejs](https://nodejs.org/en/download/prebuilt-installer).
2. (_Recommend_) Install nodemon by running _npm install nodemon -g_ in either commandprompt (Win+r 'cmd') _Windows_ or _Terminal_ (search in finder) on mac.

## Running the server
### Windows
1. Go to the folder there the code is located and run _server.bat_
### Mac/Linux
1. Go to the folder there the code is located in the terminal and run the command _nodemon server_ or _node server_ if you do not have nodemon installed.

## Generating the files to upload to the external server (etc simply.com)
### Windows
1. Go to the folder there the code is located and run _generate_content.bat_
### Mac/Linux
1. Go to the folder there the code is located in the terminal and run the command _nodemon generate_content.js_ or _node generate_content.js_ if you do not have nodemon installed.

## Uploading content to external server (etc simply.com)
### Windows
1. Install WinSCP, connect to the server with the ftp/ftps password
2. Copy all content from the _generated_content_ to the server. The directory is located in the root of the no-dub install location.
### Mac/Linux
1. Find sutable software for mac or linux to transfere a folder to the external server.
2. Copy all content from the _generated_content_ to the server. The directory is located in the root of the no-dub install location.