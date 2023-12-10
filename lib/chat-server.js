const io = require("../server");

let guestNumber = 1;
const nickNames = {};
const nameUsed = [];
const currentRoom = {};

function assignGuestNumber(socket) {
	const name = "Guest" + guestNumber;
	nickNames[socket.id] = name;
	socket.emit("nameResult", {
		success: true,
		name: name,
	});
	nameUsed.push(name);
	return guestNumber++;
}

function joinRoom(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit("joinResult", { room: room });
	socket.broadcast.to(room).emit("message", {
		text: nickNames[socket.id] + " has joined " + room + ".",
	});
	const usersInRoom = Object.keys(io.io.sockets.adapter.rooms[room].sockets);
	if (usersInRoom.length > 1) {
		let usersInRoomSummary = "Users currently in " + room + ": ";
		usersInRoom.forEach((userSocketId, index) => {
			if (index > 0) {
				usersInRoomSummary += ", ";
			}
			usersInRoomSummary += nickNames[userSocketId];
		});
		usersInRoomSummary += ".";
		socket.emit("message", { text: usersInRoomSummary });
	}
}

const handleNameChangeAttempts = (socket) => {
	socket.on("nameAttempt", (name) => {
		if (name.indexOf("Guest") === 0) {
			socket.emit("nameResult", {
				success: false,
				message: 'Names cannot begin with "Guest".',
			});
		} else if (nameUsed.indexOf(name) === -1) {
			const previousName = nickNames[socket.id];
			const previousNameIndex = nameUsed.indexOf(previousName);
			nameUsed.push(name);
			nickNames[socket.id] = name;
			delete nameUsed[previousNameIndex];
			socket.emit("nameResult", {
				success: true,
				name: name,
			});
			socket.broadcast.to(currentRoom[socket.id]).emit("message", {
				text: previousName + " is now known as " + name + ".",
			});
		} else {
			socket.emit("nameResult", {
				success: false,
				message: "That name is already in use.",
			});
		}
	});
};

const handleMessageBroadcasting = (socket) => {
	socket.on("message", (message) => {
		socket.broadcast.to(message.room).emit("message", {
			text: nickNames[socket.id] + ": " + message.text,
		});
	});
};

function handleRoomJoining(socket) {
	socket.on("join", function (room) {
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket) {
	socket.on("disconnect", function () {
		const nameIndex = nameUsed.indexOf(nickNames[socket.id]);
		if (nameIndex !== -1) {
			delete nameUsed[nameIndex];
		}
		delete nickNames[socket.id];
	});
}

exports.listen = function (server) {
	io.io.on("connection", function (socket) {
		guestNumber = assignGuestNumber(socket);
		joinRoom(socket, "lobby");
		handleMessageBroadcasting(socket);
		handleNameChangeAttempts(socket);
		handleRoomJoining(socket);
		socket.on("rooms", function () {
			socket.emit("rooms", Object.keys(io.sockets.adapter.rooms));
		});
		handleClientDisconnection(socket);
	});
};
