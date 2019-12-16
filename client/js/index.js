// import { domainToUnicode } from "url";

var auth;
const wsChat = $(".chat-output");
// const wsStatus = document.querySelector("#ws-status");
// const wsMessages = document.querySelector("#ws-messages");
const chatOutput = document.querySelector(".chat-output");
const game = document.getElementById("game");
const main = document.getElementById("main");
// Current authenticated user
var userID;
var gameID = 1;
// const bet = document.querySelector("#bet");
// const stand = document.querySelector("#stand");
// const hit = document.querySelector("#hit");


// When a user logs in
$("#login").submit(async function( event ) {
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
            userID = json["players"][0].id;
            $("#login").css("display", "none");
            $("#game").css("display", "inline-block");
            $("#main").css("display", "inline-block");
            renderAllUsers(json);
            var authToken = xhr.getResponseHeader("Authorization");
            auth = authToken;
            webSocket(authToken);
        } else if (xhr.readyState === 4 && xhr.status >= 400) {
            // alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
    event.preventDefault();
});

async function webSocket(authToken) {
    ws = await openWebSocket(authToken);
    // wsStatus.textContent = "Open";

    ws.addEventListener("close", () => {

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
        } else if (jsonData.type == "bet-new") {
            handleNewBet(jsonData);
        } else if (jsonData.type == "card-new") {
            handleNewCard(jsonData);
        } else if (jsonData.type == "user-new") {
            renderPlayer(jsonData.user, "betting", false);
        } else if (jsonData.type == "status-update") {
            handleStatusUpdate(jsonData);
        } else if (jsonData.type == "message-result") {
            handleGameResult(jsonData);
        } else if (jsonData.type == 'player-delete') {
            handleRemovedPlayer(jsonData);
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
            // alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
}

function handleGameResult(jsonData) {
    let p = document.createElement("p");
    p.textContent = jsonData["username"] + " " + jsonData["result"] + "!";
    chatOutput.appendChild(p);
    // Make the play again visible
    let pa = document.getElementById("play-again");
    pa.setAttribute("style", "display: inline-block;");

    var player = document.getElementById(jsonData["id"]);
    var chipCounter = player.querySelector(".chip-counter");
    chipCounter.innerHTML = jsonData["chips"];

}

function handleRemovedPlayer(jsonData) {
    var toRemove = document.getElementById(jsonData["id"]);
    toRemove.parentNode.removeChild(toRemove);
}

function handleStatusUpdate(jsonData) {
    var player = document.getElementById(jsonData["id"]);
    var statusText = player.querySelector(".status-text");
    statusText.innerHTML = jsonData["status"];
    var statusImage = player.querySelector(".status-icon");
    statusImage.setAttribute("src", "img/green-check.png");
}

function handleMessage(username, message) {
    let p = document.createElement("p");
    p.textContent = username + ": " + message.body;
    chatOutput.appendChild(p);
}

function handleNewBet(jsonData) {
    var player = document.getElementById(jsonData["id"]);
    var chipCounter = player.querySelector(".chip-counter");
    chipCounter.innerHTML = jsonData["chips"];
    var statusText = player.querySelector(".status-text");
    statusText.innerHTML = jsonData["status"];
    var statusImage = player.querySelector(".status-icon");
    statusImage.setAttribute("src", "img/green-check.png");
}

function handleNewCard(jsonData) {
    var player = document.getElementById(jsonData["id"]);
    var cardContainer = player.querySelector(".card-container");
    for (var i = 0; i < jsonData["cards"].length; i++) {
        var card = document.createElement("img");
        card.classList.add("card", "card-front");
        card.setAttribute('src', "https://deckofcardsapi.com/static/img/" + jsonData["cards"][i] + ".png");
        card.setAttribute('alt', "card-back");
        card.setAttribute("style", "float:left;");
        cardContainer.appendChild(card);
    }
}


function renderPlayer(player, status, hasCards) {
    var otherPlayer = player;
    var statusContainer = document.createElement("div");
    statusContainer.classList.add("status-container", "other-status-container");
    var statusImage = document.createElement("img");
    statusImage.classList.add("status-icon", "green-checkmark");
    statusImage.setAttribute("alt", "green-checkmark");
    var statusText = document.createElement("p");
    statusText.classList.add("status-text", "other-status-text");

    if (otherPlayer.status == "ready") {
        statusImage.setAttribute("src", "img/green-check.png");
    } else  {
        statusImage.setAttribute("src", "img/red-x.png");
    }
    statusText.innerHTML = status;
    statusContainer.appendChild(statusImage);
    statusContainer.appendChild(statusText);

    // // Container for cards
    var cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container", "other-card-container");
    
    if (hasCards) {
        // Handle all player cards
        for (var j = 0; j < otherPlayer.cards.length; j++) {
            if (otherPlayer.cards[j] != "Holder") {
                var card = document.createElement("img");
                card.classList.add("card", "card-front");
                card.setAttribute('src', "https://deckofcardsapi.com/static/img/" + otherPlayer.cards[j] + ".png");
                card.setAttribute('alt', "card-back");
                card.setAttribute("style", "float:left;");
                cardContainer.appendChild(card);
            }
        }
    }
    

    var playerContainer = document.createElement("div");
    playerContainer.setAttribute("id", otherPlayer.id);
    playerContainer.classList.add("player-container", "other-player-container");
    
    var statusBar = document.createElement("div");
    statusBar.classList.add("status-bar", "other-player-status");
    
    var chipContainer = document.createElement("div");
    chipContainer.classList.add("chip-container", "other-chip-container");
    
    var chipIcon = document.createElement("img");
    chipIcon.classList.add("chip-icon");
    chipIcon.setAttribute("src", "img/poker-chip.png");
    chipIcon.setAttribute("alt", "poker-chip-icon");
    
    var chipCounter = document.createElement("p");
    chipCounter.classList.add("chip-counter", "other-chip-counter");
    chipCounter.innerHTML = otherPlayer.chips;
    
    chipContainer.appendChild(chipIcon);
    chipContainer.appendChild(chipCounter);
    statusBar.appendChild(chipContainer);
    statusBar.appendChild(statusContainer);
    playerContainer.appendChild(statusBar);
    
    var nameContainer = document.createElement("div");
    nameContainer.classList.add("name-container", "other-name-container");

    var playerName = document.createElement("p");
    playerName.setAttribute("style", "text-align: center;");
    playerName.classList.add("player-name", "other-player-name");
    playerName.innerHTML = otherPlayer.userName;

    nameContainer.appendChild(playerName);

    playerContainer.appendChild(nameContainer);
    playerContainer.appendChild(cardContainer);
    game.appendChild(playerContainer);
}

function renderAllUsers(jsonData) {
    // Handle first player: currently logged in user
    renderMainPlayer(jsonData);
    renderHouse(jsonData);

    // Render all other players
    for (var i = 2; i < jsonData["players"].length; i++) {
        var otherPlayer = jsonData["players"][i];
        renderPlayer(otherPlayer, otherPlayer.status, true);
    }
}



function renderMainPlayer(jsonData) {
    var mainPlayer = jsonData["players"][0];

    var statusContainer = document.createElement("div");
    statusContainer.classList.add("status-container", "main-status-container");
    var statusImage = document.createElement("img");
    statusImage.classList.add("status-icon", "green-checkmark");
    statusImage.setAttribute("alt", "green-checkmark");
    var statusText = document.createElement("p");
    statusText.classList.add("status-text", "main-status-text");

    if (mainPlayer.status == "ready") {
        statusImage.setAttribute("src", "img/green-check.png");
    } else  {
        statusImage.setAttribute("src", "img/red-x.png");
    }
    statusText.innerHTML = mainPlayer.status;
    statusContainer.appendChild(statusImage);
    statusContainer.appendChild(statusText);

    // Container for cards
    var cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container", "main-card-container");
    

    // Handle all player cards
    for (var i = 0; i < mainPlayer.cards.length; i++) {
        if (mainPlayer.cards[i] != "Holder") {
            var card = document.createElement("img");
            card.classList.add("card", "card-front");
            card.setAttribute('src', "https://deckofcardsapi.com/static/img/" + mainPlayer.cards[i] + ".png");
            card.setAttribute('alt', "card-back");
            card.setAttribute("style", "float:left;");
            cardContainer.appendChild(card);
        }
    }

    var playerContainer = document.createElement("div");
    playerContainer.setAttribute("id", mainPlayer.id);
    playerContainer.classList.add("player-container", "main-player-container");
    
    var statusBar = document.createElement("div");
    statusBar.classList.add("status-bar", "main-player-status");
    
    var chipContainer = document.createElement("div");
    chipContainer.classList.add("chip-container", "main-chip-container");
    
    var chipIcon = document.createElement("img");
    chipIcon.classList.add("chip-icon");
    chipIcon.setAttribute("src", "img/poker-chip.png");
    chipIcon.setAttribute("alt", "poker-chip-icon");
    
    var chipCounter = document.createElement("p");
    chipCounter.classList.add("chip-counter", "main-chip-counter");
    chipCounter.innerHTML = mainPlayer.chips;
    
    chipContainer.appendChild(chipIcon);
    chipContainer.appendChild(chipCounter);
    statusBar.appendChild(chipContainer);
    statusBar.appendChild(statusContainer);
    playerContainer.appendChild(statusBar);
    
    var nameContainer = document.createElement("div");
    nameContainer.classList.add("name-container", "main-name-container");

    var playerName = document.createElement("p");
    playerName.setAttribute("style", "text-align: center;");
    playerName.classList.add("player-name", "main-player-name");
    playerName.innerHTML = mainPlayer.userName;

    nameContainer.appendChild(playerName);

    playerContainer.appendChild(nameContainer);
    playerContainer.appendChild(cardContainer);

    game.insertBefore(playerContainer, game.firstChild);
}


// Render the house 
function renderHouse(jsonData) {
    var house = jsonData["players"][1];

    // Container for cards
    var cardContainer = document.createElement("div");
    cardContainer.classList.add("card-container", "house-card-container");

    // Handle all player cards
    for (var i = 0; i < house.cards.length; i++) {
        if (house.cards[i] != "Holder") {
            var card = document.createElement("img");
            card.classList.add("card", "card-front");
            card.setAttribute('src', "https://deckofcardsapi.com/static/img/" + house.cards[i] + ".png");
            card.setAttribute('alt', "card-back");
            card.setAttribute("style", "float:left;");
            cardContainer.appendChild(card);
        }
    }

    var playerContainer = document.createElement("div");
    playerContainer.setAttribute("id", house.id);
    playerContainer.classList.add("player-container", "house-player-container");
    playerContainer.setAttribute("style", "position: fixed;")
    
        
    var nameContainer = document.createElement("div");
    nameContainer.classList.add("name-container", "house-name-container");

    var playerName = document.createElement("p");
    playerName.setAttribute("style", "text-align: center;");
    playerName.classList.add("player-name", "house-player-name");
    playerName.innerHTML = house.userName;

    nameContainer.appendChild(playerName);

    playerContainer.appendChild(nameContainer);
    playerContainer.appendChild(cardContainer);
    main.appendChild(playerContainer);
}



// Add a new message
$("#bet").click(function( event ) {
    let betText = $(".bet-input").val();
    let betInt = parseInt(betText);
    var jsonData = {};
    jsonData["BetAmount"] = betInt;
    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/games/1/users/" + userID + "/bet";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // Websocket will update chat
        } else if (xhr.readyState === 4) {
            // alert(xhr.responseText);
        }
    };
    var data = JSON.stringify(jsonData);
    xhr.send(data);
    event.preventDefault();
});


$("#stand").click(async function( event ) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/games/1/users/" + userID + "/stand";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // Websocket will update chat
        } else if (xhr.readyState === 4) {
            // alert(xhr.responseText);
        }
    };
    xhr.send();
    event.preventDefault();
});


$("#hit").click(async function( event ) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/games/1/users/" + userID + "/hit";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // Websocket will update chat
        } else if (xhr.readyState === 4) {
            // alert(xhr.responseText);
        }
    };
    xhr.send();
    event.preventDefault();
});


$("#play-again").click(async function( event ) {
    // Clear main
    var main = document.querySelector(".main-card-container");
    while (main.firstChild) {
        main.removeChild(main.firstChild);
    }

    // Clear house
    var house = document.querySelector(".house-card-container");
    while (house.firstChild) {
        house.removeChild(house.firstChild);
    }

    // Clear others
    var otherPlayers = document.querySelectorAll(".other-card-container");
    otherPlayers.forEach(function (element) {
        while (element.firstChild)  {
            element.removeChild(element.firstChild);
        }
    });
    $("#play-again").css("display", "none");
});


$("#logout").click(async function( event ) {
    var xhr = new XMLHttpRequest();
    var url = "https://api.raffisy.com/v1/users/unregister/" + userID;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            // Websocket will update chat
        } else if (xhr.readyState === 4) {
            // alert(xhr.responseText);
        }
    };
    xhr.send();
    $("#login").css("display", "flex");
    $("#game").css("display", "none");
    $("#main").css("display", "none");
    event.preventDefault();
});
