var sys = require('sys');

module.exports = function(id, bufferSize) {
	var room = {};
	var clientCount = 0;
	var clients = {};
	var nicknames = {};
	var buffer = [];

	var broadcast = function(message, sender) {
		for (sessionId in clients) {
			var client = clients[sessionId];
			if (buffer.length > bufferSize) buffer.shift();

			if (!sender || sender.sessionId != client.sessionId) {
				client.send(message);
			}
		}
	};

	var splitNickname = function(str) {
		var reverse = parseInt(str.split('').reverse().join(''), 10);
		if (isNaN(reverse)) return {prefix: str, suffix: null};
		var suffix = parseInt(String(reverse).split('').reverse().join(''), 10);
		return {prefix: str.substring(0, str.length - String(suffix).length), suffix: suffix};
	};


	var assignNickname = function(nickname, client) {
		var nicks = {};
		for (sessionId in nicknames) {
			nicks[nicknames[sessionId]] = sessionId;
		}

		if (!(nickname in nicks)) {
			nicknames[client.sessionId] = nickname;
			return;
		}

		var nick = splitNickname(nickname);
		var i = nick.suffix ? nick.suffix : 1;
		while ((nick.prefix + i) in nicks && nicks[nick.prefix + i] != client.sessionId) {
			i++;
		}

		nicknames[client.sessionId] = nick.prefix + i;
	};

	var getNickname = function(client) {
		if (!client) return null;
		return nicknames[client.sessionId];
	};

	room.addClient = function(nickname, client) {
		clients[client.sessionId] = client;
		assignNickname(nickname, client);
		clientCount++;
		client.send({
			action: 'init', 
			value: {
				buffer: buffer,
				nicknames: nicknames,
				roomId: id
			}
		});
		room.broadcastAnnouncement(getNickname(client) + ' has joined.', client);
		broadcast({action: 'nicknamesUpdated', value: nicknames});
	};

	room.removeClient = function(client) {
		room.broadcastAnnouncement(getNickname(client) + ' has left.', client);
		delete clients[client.sessionId];
		delete nicknames[client.sessionId];
		clientCount--;
		broadcast({action: 'nicknamesUpdated', value: nicknames});
	};

	room.getClientCount = function() {
		return clientCount;
	};

	room.getID = function() {
		return id;
	};

	room.broadcastAnnouncement = function(message, sender) {
		buffer.push({message: message, type: 'announcement', nickname: getNickname(sender)});
		broadcast({action: 'announcement', value: {message: message, nickname: getNickname(sender)}}, sender);
	};

	room.broadcastStatus = function(status, sender) {
		status = getNickname(sender) + ' ' + status;
		room.broadcastAnnouncement(status);
	};

	room.broadcastMessage = function(message, sender) {
		buffer.push({message: message, type: 'message', nickname: getNickname(sender)});
		broadcast({action: 'message', value: {message: message, nickname: getNickname(sender)}}, sender);
	};

	room.changeNickname = function(nickname, client) {
		var oldNick = getNickname(client);
		if (oldNick === nickname) {
			return;
		}
		assignNickname(nickname, client);
		var newNick =  getNickname(client);
		if (oldNick === newNick) {
			return;
		}
		broadcast({action: 'nicknamesUpdated', value: nicknames});
		room.broadcastAnnouncement(oldNick + ' is now known as ' + newNick);
	};

	return room;
};
