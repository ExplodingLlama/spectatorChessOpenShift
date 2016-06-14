var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");

var server = http.createServer(function (request, response) {	
  var filePath = false;
  
  if(request.url == '/') {
    filePath = "public/index.html";
  } else {
    filePath = "public" + request.url;
  }

  var absPath = "./" + filePath;
  serverWorking(response, absPath);

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

function serverWorking(response, absPath){
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

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8448;

server.listen(port,ipaddress);

console.log('Server is running on ' + port.toString() + ' port');

