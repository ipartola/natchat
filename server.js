var 
		crypto = require('crypto'),
		http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		sys = require('sys'),
		Relay = require('./relay'),
		mimeTypes = {
			'ico': 'image/vnd.microsoft.icon',
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
		
root = __dirname + '/htdocs',
server = http.createServer(function(req, res) {
	var path = url.parse(req.url).pathname;

	if (req.headers.host != 'natchat.com' && req.headers.host != 'localhost') {
		res.writeHead(301, {'Location': 'https://natchat.com' + path, 'Content-Length': 0});
		res.end();
		return;
	}

	if (path[path.length - 1] == '/') {
		path += 'index.html';
	}

	console.log(req.socket.remoteAddress + ' - ' + req.method + ' ' + req.url);

	fs.readFile(root + path, function(err, data){
		if (err) return send404(res);

		res.writeHead(200, {'Content-Type': getMimeType(getExtension(path)), 'Content-Length': data.length});
		res.end(data, 'utf8');
	});
}),

send404 = function(res){
	res.writeHead(404);
	res.end('404');
};


settings = require('./settings');

var log = fs.createWriteStream(settings.LOG_FILE, {flags: 'a'});

var relayOptions = {
	resource: 'socket.io',
	transports: ['websocket', 'server-events', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling'],
	//transportOptions: {},
	log: function(str) {
		sys.puts(str);
	}
};

var privateKey = fs.readFileSync(settings.PRIVATE_KEY).toString();
var certificate = fs.readFileSync(settings.CERTIFICATE).toString();

var credentials = crypto.createCredentials({key: privateKey, cert: certificate});
server.setSecure(credentials);
server.listen(settings.PORT);
var relay = Relay(server, settings.BUFFER_SIZE, settings.MAX_BASE_NICKNAME_LENGTH, relayOptions);
