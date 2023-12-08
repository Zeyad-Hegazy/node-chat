const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = import("mime");

const cache = {};

function send404(response) {
	response.writeHead(404, { "Content-Type": "text/plain" });
	response.write("Error 404: resource not found");
	response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(200, {
		"content-type": mime.lookup(path.basename(filePath)),
	});
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.existsSync(absPath, function (exists) {
			if (exists) {
				fs.readFileSync(absPath, function (err, data) {
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
		filePath = "public/index.html";
	} else {
		filePath = "public" + request.url;
	}

	const absPath = "./" + filePath;
	serveStatic(response, cache, absPath);
});

server.listen(6000, function () {
	console.log("Server listening on port 6000.");
});
