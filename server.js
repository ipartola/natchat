var http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		sys = require('sys'),
		Relay = require('./relay'),
		mimeTypes = {
			'js': 'text/javascript',
			'css': 'text/css',
			'html': 'text/html'
		},
		defaultMimeType = 'text/html',

getExtension = function(str) {
	if (str.lastIndexOf('.') < 0) return null;
	return str.substring(str.lastIndexOf('.') + 1);
},
getMimeType = function(extension) {
	return (extension in mimeTypes) ? mimeTypes[extension] : defaultMimeType;
},
		
server = http.createServer(function(req, res) {
	// your normal server code
	var path = url.parse(req.url).pathname; var root = __dirname + '/htdocs';

	if (path[path.length - 1] == '/') {
		path += 'index.html';
	}

	fs.readFile(root + path, function(err, data){
		if (err) return send404(res);

		res.writeHead(200, {'Content-Type': getMimeType(getExtension(path))});
		res.write(data, 'utf8');
		res.end();
	});
}),

send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
};


var BUFFER_SIZE = 15, PORT = 8080;
var relayOptions = {
	resource: 'socket.io',
	transports: ['websocket', 'server-events', /*'flashsocket', */'htmlfile', 'xhr-multipart', 'xhr-polling'],
	//transportOptions: {},
	log: sys.log
};
server.listen(PORT);
var relay = Relay(server, BUFFER_SIZE, relayOptions);
