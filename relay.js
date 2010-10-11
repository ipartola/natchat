var io = require('./lib/socket.io-node/lib/socket.io'),
	ChatRoomManager = require('./chat-room-manager');

module.exports = function(server, chatRoomBufferSize, maxBaseNicknameLength, relayOptions) {
	var roomManager = ChatRoomManager(chatRoomBufferSize, maxBaseNicknameLength);
	var clientIPMap = {};

	var getRoom = function(client) {
		if (client.connection && client.connection.remoteAddress) {
			var ip = client.connection.remoteAddress;
			clientIPMap[client.sessionId] = ip;
		}
		else {
			var ip = clientIPMap[client.sessionId];
		}
		return roomManager.getRoom(ip);
	};


	var relay = io.listen(server, relayOptions);

	relay.on('clientConnect', function(client) {
		client.send(client.sessionId);
	});

	relay.on('clientMessage', function(obj, client) {
		switch (obj.action) {
			case 'enter':
				getRoom(client).addClient(obj.value, client);
				break;
			case 'nickname':
				getRoom(client).changeNickname(obj.value, client);
				break;
			case 'status':
				getRoom(client).broadcastStatus(obj.value, client);
				break;
			case 'message':
				getRoom(client).broadcastMessage(obj.value, client);
				break;
		}
	});

	relay.on('clientDisconnect', function(client) {
		var room = getRoom(client);
		room.removeClient(client);
		delete clientIPMap[client.sessionId];
		if (room.getClientCount() < 1) {
			roomManager.removeRoom(room);
		}
	});

	return relay;
};
