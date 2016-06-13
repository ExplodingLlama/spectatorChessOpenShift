var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");

var currentData = "No data yet recieved from LichessTV";

var server = http.createServer(function (request, response) {	
    var filePath = false;
  
    if(request.url == '/') {
        filePath = "public/index.html";
    } else {
        filePath = "public" + request.url;
    }

    var absPath = "./" + filePath;
    serverWorking(request, response, absPath);
});

function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write("Error 404: file not found");
  response.end();
}

function sendPage(response, filePath, fileContents){
  response.writeHead(200, {"ContentType": mime.lookup(path.basename(filePath))});
  response.end(fileContents);
}

function sendStream(request, response) {
    response.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});

    var interval = setInterval(function() {
      response.write("data: " + currentData + "\n\n");
    }, 1000);
}

function serverWorking(request, response, absPath){
    
    if(absPath === "./public/stream") {
        sendStream(request, response);
        return;
    }
    fs.exists(absPath, function(exists){
        if(exists){
            fs.readFile(absPath, function(err, data){
                if(err){
                    send404(response);
                } else {
                    sendPage(response, absPath, data);
                }
            });
        } else {
            send404(response);
        }
    });
}

var port_number = server.listen(process.env.PORT || 8484);

console.log('Server is running on ' + port_number.toString() + ' port');

