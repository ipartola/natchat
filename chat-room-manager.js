var Room = require('./chat-room');

module.exports = function(bufferSize, maxBaseNicknameLength) {
	var manager = {};
	var rooms = {};

	manager.addRoom = function(room) {
		rooms[room.getID()] = room;
	};

	manager.removeRoom = function(room) {
		delete rooms[room.getID()];
	};

	manager.getRoom = function(id) {
		if (id in rooms) {
			var room = rooms[id];
		}
		else {
			var room = Room(id, bufferSize, maxBaseNicknameLength);
			manager.addRoom(room);
		}

		return room;
	};

	return manager;
};
