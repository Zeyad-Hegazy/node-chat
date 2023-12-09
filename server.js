const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = require("mime");

const cache = {};

const chatServer = require("./lib/chat-server");

function send404(response) {
	console.log("somthing went wrong");
	response.writeHead(404, { "Content-Type": "text/plain" });
	response.write("Error 404: resource not found");
	response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(200, {
		"Content-Type": mime.lookup(path.basename(filePath)),
	});
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function (exists) {
			if (exists) {
				console.log("file exist");
				fs.readFile(absPath, function (err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

const server = http.createServer(function (request, response) {
	console.log("Request received");
	let filePath;

	if (request.url === "/") {
		console.log("into html");
		filePath = "public/index.html";
	} else {
		filePath = "public" + request.url;
	}

	const absPath = "./" + filePath;
	serveStatic(response, cache, absPath);
});

server.listen(3000, function () {
	console.log("Server listening on port 3000.");
});

chatServer.listen(server);
