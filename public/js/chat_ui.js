function divEscapedContentElement(message) {
	return $("<div></div>").text(message);
}

function divSystemContentElement(message) {
	return $("<div></div>").html("<i>" + message + "</i>");
}

function processUserInput(chatApp, socket) {
	const message = $("#send-message").val();
	let systemMessage;

	if (message[0] === "/") {
		systemMessage = chatApp.processCommand(message);
		if (systemMessage) {
			$("#messages").append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($("#room").text(), message);
		$("#messages").append(divEscapedContentElement(message));
		$("#messages").scrollTop($("#messages").prop("scrollHeight"));
	}
	$("#send-message").val("");
}
