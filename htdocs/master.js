;jQuery(document).ready(function($) {
	// Cookies
	var setCookie = function(name, value, days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else {
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/";
	}

	var getCookie = function(name) {
		var ca = document.cookie.split(';');
		for(var i = 0, len = ca.length; i < len; i++) {
			var c = $.trim(ca[i]);
			var kv = c.split('=', 2);
			if (kv[0] == name && kv.length == 2) {
				return kv[1];
			}
		}
		return null;
	}

	// Adjust heights
	var adjustDimentions = function() {
		var height = $(window).height() - $('#header').outerHeight();
		$('#content').height(height);
		$('#form').width($('#chat').outerWidth()).show();
		$('#form #text').width($('#form').width() - $('#form #text').outerWidth() + $('#form #text').width());
		$('#chat').height(height - $('#chat').outerHeight() + $('#chat').height() - $('#form').outerHeight());
		$('#clients').height(height - $('#clients').outerHeight() + $('#clients').height());
	};

	$(window).resize(adjustDimentions).triggerHandler('resize');
	$('#form #text').attr('disabled', true);

	// Mechanics
	var socket = new io.Socket().connect();
	var nicknames = {};
	myId = null;

	var getMyNickname = function() {
		if (myId in nicknames) {
			return nicknames[myId];
		}

		var cn = getCookie('nickname');
		if (cn) {
			return cn;
		}

		return myId;
	};

	// The protocol:
	// Client connects
	// 		Server sends clientId
	// Client installs normal message handler
	// Client responds with nickname
	// 		Server sends almanach
	

	var initHandler = function(clientId) {
		myId = clientId;
		socket.removeEvent('message', initHandler);
		socket.on('message', handler);
		socket.send({action: 'enter', value: getMyNickname()});
	};

	socket.on('message', initHandler);

	$(window).unload(function() {
		socket.disconnect();
	});

	var handler = function(obj) {
		switch (obj.action) {
			case 'init':
				updateClientList(obj.value.nicknames);
				$('#chat').empty();

				for (var i = 0, len = obj.value.buffer.length; i < len; i++) {
					var message = obj.value.buffer[i];
					if (message.type == 'message') {
						addMessage(message.message, message.nickname);
					}
					if (message.type == 'announcement') {
						announce(message.message, message.nickname);
					}
				}
				
				$('#external-ip').text(': ' + obj.value.roomId);

				$('#form #text').removeAttr('disabled').focus();
				break;
			case 'announcement':
				announce(obj.value.message, obj.value.nickname);
				break;
			case 'message':
				addMessage(obj.value.message, obj.value.nickname);
				break;
			case 'nicknamesUpdated':
				updateClientList(obj.value);
				break;
		}
	};

	$('#form').submit(function() {
		var val = $.trim($(this).find('#text').val());
		$(this).find('#text').val('');
		if (!val) return;
		if (val.substring(0, 1) == '/') {
			handleCommand(val);
		}
		else {
			sendMessage(val);
		}
		return false;
	});

	var handleCommand = function(val) {
		if (val.indexOf(' ') < 0 || val.indexOf(' ') >= val.length - 1) return;
		var command = val.substring(1, val.indexOf(' '));
		var val = val.substring(val.indexOf(' ') + 1);

		switch (command) {
			case 'nick':
				var nick = $.trim(val).split(/\s+/)[0];
				socket.send({action: 'nickname', value: val});
				break;
			case 'me':
				socket.send({action: 'status', value: $.trim(val)});
				break;
		}
	};

	var sendMessage = function(val) {
        socket.send({action: 'message', value: val});
		addMessage(val, null);
	};

	var addMessage = function(message, nickname) {
		var label = $('<label></label>');
		nickname = nickname ? nickname : nicknames[myId];
		label.text(nickname + ': ');

		var span = $('<span></span>').text(message);

		var p = $('<p></p>').append(label).append(span);
		$('#chat').append(p);
		$('#chat').animate({scrollTop: 10000000}, 200);
	};

	var announce = function(announcement, nickname) {
		var p = $('<p></p>').append($('<em></em>').text(announcement));
		$('#chat').append(p);
		$('#chat').animate({scrollTop: 10000000}, 200);
	};

	var updateClientList = function(allNicknames) {
		nicknames = allNicknames;
		var ul = $('#client-list').empty();
		var count = 0;
		$.each(nicknames, function(clientId, nickname) {
			var li = $('<li></li>').attr('id', 'client-id-' + clientId).text(nickname);
			if (clientId === myId) {
				setCookie('nickname', nickname, 365);
				li.addClass('me');
			}
			ul.append(li);
			count++;
		});

		$('#clients h2').text(count + (count > 1 ? ' people' : ' person') + ' here');
	};

});
