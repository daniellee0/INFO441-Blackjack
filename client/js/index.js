var auth;
const wsChat = $(".chat-output");
const wsStatus = document.querySelector("#ws-status");
const wsMessages = document.querySelector("#ws-messages");
const chatOutput = document.querySelector(".chat-output");

// When a user logs in
$( "#login" ).submit(async function( event ) {
    var jsonData = {};
    jsonData["Email"] = $("#email").val();
    jsonData["Password"] = $("#password").val();

    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/users/register";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // json[0] represents the user that logged in
            var json = JSON.parse(xhr.responseText);
            $("#login").css("display", "none");
            $("#game").css("display", "inline-block");
            var authToken = xhr.getResponseHeader("Authorization");
            auth = authToken;
            webSocket(authToken);
        } else if (xhr.readyState ===4) {
            alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
    event.preventDefault();
});

async function webSocket(authToken) {
    ws = await openWebSocket(authToken);
    wsStatus.textContent = "Open";

    ws.addEventListener("close", () => {
        wsStatus.textContent = "Closed";
        wsStatus.classList.remove("alert-success");
        wsStatus.classList.add("alert-danger");
    });
    ws.addEventListener("error", err => {
        console.error(err);
        let p = document.createElement("p");
        p.textContent = err.message || "unspecified error: see Console";
        p.classList.add("text-danger");
        wsMessages.appendChild(p);
    });
    ws.addEventListener("message", evt => {
        jsonData = JSON.parse(evt.data);
        if (jsonData.type == "message-new") {
            handleMessage(jsonData.username, jsonData.message);
        }
    });
}

async function openWebSocket(authToken) {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(`wss://api.raffisy.com/v1/websocket?auth=${authToken}`);
        ws.addEventListener("open", () => {
            resolve(ws);
        });
    });
}

// Add a new message
$(".submit-button").click(function() {
    let chatText = $(".chat-input").val();
    sendChat(chatText);
    $(".chat-input").val("");
});

// Send a chat msg
function sendChat(chatText) {
    var jsonData = {};
    jsonData["body"] = chatText;
    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/games/1";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // Websocket will update chat
        } else if (xhr.readyState === 4) {
            alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
}

function handleMessage(username, message) {
    let p = document.createElement("p");
    p.textContent = username + ": " + message.body;
    chatOutput.appendChild(p);
}