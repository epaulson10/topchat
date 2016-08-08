var socket = io();

var activeRoom = "lobby";
$(document).ready(function() {
    socket.emit('join', {room: "lobby"});

    var nickName = Cookies.get("didactichatNickname");
    if (nickName === undefined) {
        nickName = "";
        while (nickName === null) {
            nickName = window.prompt("Enter your nickname (can't be blank)");
        }
        Cookies.set("didactichatNickname", nickName, {expires: 7});
    }

    socket.emit("NICK", nickName);

});

function sendMessage() {
    var msgBox = $("#composeBox");
    socket.emit('text message', { message: msgBox.val(), room: activeRoom});
    msgBox.val("");
};

function sendNick() {
    var nickBox = $('#nickBox');
    socket.emit('NICK', nickBox.val());
    nickBox.val('');
};

function createRoom() {
    var room;
    room = window.prompt("Enter room name");
    if (room !== null && room !== "") {
        socket.emit('join', {room: room});
    }
}

function addRoomClickHandler(room) {
    $('#'+room + "list").click(function() {
        $(this).css('color', 'blue');
        $('#'+activeRoom + "list").css('color', 'black');
        $('#'+activeRoom).hide();
        activeRoom = $(this).text();
        $('#'+activeRoom).show();
    });
}

socket.on('text message', function(message) {
    var messageList = $('#messageList');
    addTextToMsgWindow(message.from + ": " + message.message, message.room);
});

socket.on('NICK', function(nickChange) {
    if (nickChange.oldNick !== null) {
        var changeStr = nickChange.oldNick + " is now known as " + nickChange.newNick + ".";
        addTextToMsgWindow(changeStr);
    }
});

socket.on('room create', function(newRoom) {
    $('#roomList').append("<li class='clickable' id=" + newRoom + "list><a>" + newRoom + "</a></li>");
    $('#messageDiv').append("<ul id="+ newRoom + "></ul>");
    if ($('#messageDiv').children().length > 1) {
        $('#'+newRoom).hide();
    } else {
        $('#'+newRoom + "list").css('color', 'blue');
    }

    socket.emit('join', {room: newRoom});
    addRoomClickHandler(newRoom);
});


socket.on('room list', function(roomList) {
    for (var i = 0; i < roomList.length; i++) {
        $('#roomList').append("<li class='clickable' id=" + roomList[i]+"list>" + roomList[i] + "</li>");
        $('#messageDiv').append("<ul id="+roomList[i] + "></ul>");
        addRoomClickHandler(roomList[i]);
        socket.emit('join', {room: roomList[i]});
        if (i == 0) {
            $('#' + roomList[i] + 'list').css('color','blue');
        } else {
            $('#' + roomList[i]).hide();
        }
        getMessagesForRoom(roomList[i], 20);
    }
});

function getMessagesForRoom(room, numMessages) {
    $.get("/chat/log", {numMessages: numMessages, room: room}, 
        function(messageArr) {
            for (var i = 0; i < messageArr.length; i++) {
                addTextToMsgWindow(messageArr[i].from + ": " + messageArr[i].message, room);
            }
        });
};

function addTextToMsgWindow(text, room) {
    var msgList;
    var roomListElem;
    if (room === undefined) {
        room = activeRoom;
        msgList = $('#' + activeRoom);
        roomListElem = $('#' + activeRoom + 'list');

    } else {
        msgList = $('#' + room);
        roomListElem = $('#' + room + 'list');
    }
    if (room != activeRoom) {
        roomListElem.css('color', 'red');
    }
    var msgDiv = $('#messageDiv');
    msgList.append("<li>" + text + "</li>");
    msgDiv.scrollTop(msgDiv.prop('scrollHeight'));
}

$(document).on("keydown", "#composeBox", function(event) {
    if (event.keyCode == 13) {
        sendMessage();
    }
});

$(document).on("keydown", "#nickBox", function(event) {
    if (event.keyCode == 13) {
        sendNick();
    }
});
