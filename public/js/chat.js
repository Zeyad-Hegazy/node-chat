class Chat {
	constructor(socket) {
		this.socket = socket;
	}

	sendMessage(room, text) {
		const message = {
			room,
			text,
		};

		this.socket.emit("message", message);
	}

	changeRoom(room) {
		this.socket.emit("join", { newRoom: room });
	}

	processCommand(command) {
		const words = command.split(" ");
		const commandWrod = words[0].substring(1, words[0].length).toLowerCase();

		let message;
		switch (commandWrod) {
			case "join":
				words.shift();
				this.changeRoom(words.join(""));
				break;
			case "nick":
				words.shift();
				this.socket.emit("nameAttempt", words.join(""));
				break;
			default:
				message = "Unrecognized command";
				break;
		}
		return message;
	}
}

const socket = io.connect();

$(document).ready(function () {
	const chatApp = new Chat(socket);
	socket.on("nameResult", function (result) {
		let message;
		if (result.success) {
			message = "You are now known as " + result.name + ".";
		} else {
			message = result.message;
		}
		$("#messages").append(divSystemContentElement(message));
	});
	socket.on("joinResult", function (result) {
		$("#room").text(result.room);
		$("#messages").append(divSystemContentElement("Room changed."));
	});
	socket.on("message", function (message) {
		const newElement = $("<div></div>").text(message.text);
		$("#messages").append(newElement);
	});
	socket.on("rooms", function (rooms) {
		$("#room-list").empty();
		for (let room in rooms) {
			room = room.substring(1, room.length);
			if (room != "") {
				$("#room-list").append(divEscapedContentElement(room));
			}
		}
		$("#room-list div").click(function () {
			chatApp.processCommand("/join " + $(this).text());
			$("#send-message").focus();
		});
	});
	setInterval(function () {
		socket.emit("rooms");
	}, 1000);
	$("#send-message").focus();
	$("#send-form").submit(function () {
		processUserInput(chatApp, socket);
		return false;
	});
});
