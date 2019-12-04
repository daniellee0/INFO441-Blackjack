

const CARD_IMAGES = {

    // Card Back
    "B":   "img/card-back.png",

    // Hearts
    "2H":  "https://deckofcardsapi.com/static/img/2H.png",
    "3H":  "https://deckofcardsapi.com/static/img/3H.png",
    "4H":  "https://deckofcardsapi.com/static/img/4H.png",
    "5H":  "https://deckofcardsapi.com/static/img/5H.png",
    "6H":  "https://deckofcardsapi.com/static/img/6H.png",
    "7H":  "https://deckofcardsapi.com/static/img/7H.png",
    "8H":  "https://deckofcardsapi.com/static/img/8H.png",
    "9H":  "https://deckofcardsapi.com/static/img/9H.png",
    "10H": "https://deckofcardsapi.com/static/img/0H.png",
    "JH":  "https://deckofcardsapi.com/static/img/JH.png",
    "QH":  "https://deckofcardsapi.com/static/img/QH.png",
    "KH":  "https://deckofcardsapi.com/static/img/KH.png",
    "AH":  "https://deckofcardsapi.com/static/img/AH.png",

    // Diamonds
    "2D":  "https://deckofcardsapi.com/static/img/2D.png",
    "3D":  "https://deckofcardsapi.com/static/img/3D.png",
    "4D":  "https://deckofcardsapi.com/static/img/4D.png",
    "5D":  "https://deckofcardsapi.com/static/img/5D.png",
    "6D":  "https://deckofcardsapi.com/static/img/6D.png",
    "7D":  "https://deckofcardsapi.com/static/img/7D.png",
    "8D":  "https://deckofcardsapi.com/static/img/8D.png",
    "9D":  "https://deckofcardsapi.com/static/img/9D.png",
    "10D": "https://deckofcardsapi.com/static/img/0D.png",
    "JD":  "https://deckofcardsapi.com/static/img/JD.png",
    "QD":  "https://deckofcardsapi.com/static/img/QD.png",
    "KD":  "https://deckofcardsapi.com/static/img/KD.png",
    "AD":  "https://deckofcardsapi.com/static/img/aceDiamonds.png",

    // Clubs
    "2C":  "https://deckofcardsapi.com/static/img/2C.png",
    "3C":  "https://deckofcardsapi.com/static/img/3C.png",
    "4C":  "https://deckofcardsapi.com/static/img/4C.png",
    "5C":  "https://deckofcardsapi.com/static/img/5C.png",
    "6C":  "https://deckofcardsapi.com/static/img/6C.png",
    "7C":  "https://deckofcardsapi.com/static/img/7C.png",
    "8C":  "https://deckofcardsapi.com/static/img/8C.png",
    "9C":  "https://deckofcardsapi.com/static/img/9C.png",
    "10C": "https://deckofcardsapi.com/static/img/0C.png",
    "JC":  "https://deckofcardsapi.com/static/img/JC.png",
    "QC":  "https://deckofcardsapi.com/static/img/QC.png",
    "KC":  "https://deckofcardsapi.com/static/img/KC.png",
    "AC":  "https://deckofcardsapi.com/static/img/AC.png",

    // Spades
    "2S":  "https://deckofcardsapi.com/static/img/2S.png",
    "3S":  "https://deckofcardsapi.com/static/img/3S.png",
    "4S":  "https://deckofcardsapi.com/static/img/4S.png",
    "5S":  "https://deckofcardsapi.com/static/img/5S.png",
    "6S":  "https://deckofcardsapi.com/static/img/6S.png",
    "7S":  "https://deckofcardsapi.com/static/img/7S.png",
    "8S":  "https://deckofcardsapi.com/static/img/8S.png",
    "9S":  "https://deckofcardsapi.com/static/img/9S.png",
    "10S": "https://deckofcardsapi.com/static/img/0S.png",
    "JS":  "https://deckofcardsapi.com/static/img/JS.png",
    "QS":  "https://deckofcardsapi.com/static/img/QS.png",
    "KS":  "https://deckofcardsapi.com/static/img/KS.png",
    "AS":  "https://deckofcardsapi.com/static/img/AS.png"
}

// This is the template I used for what the server will send back
// to communicate to the client what the game state is.
//
// POSSIBLE GAME STATES:
//  - pregame
//  - betting
//  - playing
//  - resolving (i.e. loading, or when House is drawing cards)
//
// POSSIBLE PLAYER STATUSES:
//  - unavailable (disconnected)
//  - bust
//  - lost
//
//  - deciding
//
//  - ready (has pressed Start Game)
//  - stay
//  - won
const EXAMPLE_GAME_STATE = {
    gameState: "betting",
    players: [
        {
            playerName: "Player 1",
            playerID: "1",
            status: "ready",
            chips: 100,
            cards: ["2S", "AH"]
        },
        {
            playerName: "Player 2",
            playerID: "2",
            status: "deciding",
            chips: 92,
            cards: ["B", "B"]
        },
        {
            playerName: "house",
            cards: ["B", "B"]
        }

    ]
}

// URL used for XMLHttp POST request to register user.
const REGISTER_URL = "/v1/Users/register"

// URL used for connecting to websocket
const WEBSOCKET_URL = "wss://"

// This is the ID of the player who is on the client. Should be given
// by the server rather than pre-assigned.
var currentPlayerID = "0";
var currentGameID = "0";

// Tracks the next available slot in the client for the next player to join
// on (MAX 6 SLOTS). Note that this value starts at 2, since the current user
// is always considered as taking the first slot.
var nextVacantSlot = 2;

// ASSIGNING EVENT HANDLERS ---------------------------

var socket;

$(".login-button").click(function() {
    let playerName = $(".login-input").val();
    if (playerName.length < 1) {
        window.alert("Please put in a player name!");
    } else {
        $(".login-container").addClass("hidden");
        $(".game-container").removeClass("hidden");

        // Make POST request to register here.
        let xhr = new XMLHttpRequest();
        xhr.open('POST', REGISTER_URL, true);
        xhr.onreadystatechange = function () {
            if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                connectToSocket();
            } else {
                window.alert(xhr.status);
            }
        };
        // Send over player name to server.
        xhr.send(playerName);
    }
});

$(".start-button").click(function() {
    startGame();
});

$(".bet-button").click(function() {
    let betAmount = $(".bet-input").val();
    bet(betAmount);
    $(".bet-input").val("");
});

$(".hit-button").click(function() {
    hit();
});

$(".stay-button").click(function() {
    stay();
});

$(".chat-tab-button").click(function() {
    showChat();
});

$(".log-tab-button").click(function() {
    showLog();
});

$(".submit-button").click(function() {
    let chatText = $(".chat-input").val();
    showChat();
    sendChat(chatText);
    $(".chat-input").val("");
});

// FUNCTIONS ------------------------------------------

function connectToSocket() {
    socket = new WebSocket(URL_BASE);

    socket.onopen = function (event) {
        let registerRequest = {
            type: "register",
            text: "none"
        }
    
        socket.send(JSON.stringify(registerRequest));
    }
    
    socket.onmessage = function (event) {
        let msg = JSON.parse(event.data);
        switch(msg.type) {
            case "register":
                currentPlayerID = msg.playerID;
                currentGameID = msg.gameID;
            case "logMessage":
                addTextToLog(msg.text);
            case "chatMessage":
                addTextToChat(msg.text);
            case "update":
                updateGameState(msg.gameState);
                updateAllPlayers(msg.players);
            case "error":
                hideGameInputs();
                addTextToLog(msg.text);
            // Probably indicates some error has occurred.
            default:
                hideGameInputs();
                addTextToLog("ERROR! Something has gone wrong!");
        }
    }
    
    // Unregister client user if they close window.
    $(window).unload(function() {
        let unregisterRequest = {
            type: "unregister",
            text: "none",
            gameID: currentGameID,
            playerID: currentPlayerID
        }
    
        socket.send(JSON.stringify(unregisterRequest));
    });
    
}

// This function will send a request to the websocket connection
// confirming that the player is ready to start the game.
function startGame() {
    let startRequest = {
        type: "startGame",
        text: "none",
        gameID: currentGameID,
        playerID: currentPlayerID
    }
    
    socket.send(JSON.stringify(startRequest));
}

// This function will send a request to the websocket connection
// that the player will bet the given amount.
function bet(amount) {
    let betRequest = {
        type: "bet",
        text: amount,
        gameID: currentGameID,
        playerID: currentPlayerID
    }

    socket.send(JSON.stringify(betRequest));
}

// This function will send a request to the websocket connection
// that the player would like to draw a card.
function hit() {
    let hitRequest = {
        type: "hit",
        text: "none",
        gameID: currentGameID,
        playerID: currentPlayerID
    }

    socket.send(JSON.stringify(hitRequest));
}

// This function will send a request to the websocket connection
// that the player would like to stay.
function stay() {
    let stayRequest = {
        type: "stay",
        text: "none",
        gameID: currentGameID,
        playerID: currentPlayerID
    }

    socket.send(JSON.stringify(stayRequest));
}

// This function will send a request to the websocket connection
// to add the given text to the chat.
function sendChat(text) {
    let chatRequest = {
        type: "chat",
        text: text,
        gameID: currentGameID,
        playerID: currentPlayerID
    }

    socket.send(JSON.stringify(chatRequest));
}

// Determines which buttons/inputs to display for the client to use
// depending on the state of the game.
function updateGameState(stateString) {
    // If game hasn't started yet, show only start button.
    if (stateString === "pregame") {
        showGameStart();

    // If betting, show only bet inputs.
    } else if (stateString === "betting") {
        showBetInputs();

    // If playing, show only hit/stay buttons.
    } else if (stateString === "playing") {
        showHitStayInputs();
    
    // Otherwise, hide everything.
    } else {
        hideGameInputs();
    }
}

// Takes in an array of player objects, and updates the client
// to show all player information available to client.
function updateAllPlayers(playersArray) {

    for (let i = 0; i < playersArray.length; i++) {
        let player = playersArray[i];

        // We've reached the player representing the client.
        if (player.playerID === currentPlayerID) {
            updateMainPlayer(player);      

        // We've reached the house.
        } else if (player.playerName === "house") {
            updateHouse(player);

        } else {
            updatePlayer(player);
        }
    }
}

// Adds given text String to chat box.
function addTextToChat(text) {
    let textLine = $("<p></p>");
    textLine.addClass("chat-text");
    textLine.text(text);
    $(".chat-output").append(textLine);
}

// Adds given text String to log box.
function addTextToLog(text) {
    let textLine = $("<p></p>");
    textLine.addClass("log-text");
    textLine.text(text);
    $(".log-output").append(textLine);
}

// Uses given object containing player information to
// update the state of the client user's player on
// the client.
function updateMainPlayer(playerObj) {
    // Player name hasn't been set yet.
    if ($(".main-player-name").text() === "") {
        $(".main-player-name").text(playerObj.playerName);
    }
    updateChips(playerObj.chips, $(".main-chip-container"));
    updateStatus(playerObj.status, $(".main-status-container"));
    updateCards(playerObj.cards, $(".main-card-container"));

    // If player went bust or stays, hide game inputs since they can no longer hit/stay.
    if (playerObj.status === "bust" || playerObj.status === "stay") {
        hideGameInputs();
    }
}

// Uses given object containing player information to
// update the state of a player on the client.
function updatePlayer(playerObj) {
    // Player has not been added to client yet.
    if (!($("div").hasClass(playerObj.playerID))) {

        // Assigns player next available slot in client interface.
        let pSlotString = "player-" + nextVacantSlot;
        nextVacantSlot++;

        let pContainer = $("<div></div>");
        pContainer.addClass("player-container");
        pContainer.addClass(pSlotString);
        pContainer.addClass(playerObj.playerID);

        // Creating status bar.
        let statusBar = $("<div></div>");
        statusBar.addClass("status-bar");
        statusBar.append(buildChips(playerObj.chips));
        statusBar.append(buildStatus(playerObj.status));
        pContainer.append(statusBar);

        // Creating player name.
        let pNameContainer = $("<div></div>");
        pNameContainer.addClass("name-container");

        let pName = $("<p></p>");
        pName.addClass("player-name");
        pName.text(playerObj.playerName);

        pNameContainer.append(pName);
        pContainer.append(pNameContainer);

        // Creating player cards.
        pContainer.append(buildCards(playerObj.cards));

        // Adding player to client.
        $("body").append(pContainer);

    // Player currently exists, so just update.
    } else {
        let pClass = "." + playerObj.playerName;
        let pContainer = $(pClass);

        updateChips(playerObj.chips, pContainer.find(".chip-container"));
        updateStatus(playerObj.status, pContainer.find(".status-container"));
        updateCards(playerObj.cards, pContainer.find(".card-container"))
    }
}

// Uses given object containing house information to
// update the state of the house on the client.
function updateHouse(houseObj) {
    updateCards(houseObj.cards, $(".house-card-container"));
}

// Shows chat and hides log.
function showChat() {
    $(".chat-output").removeClass("hidden");
    $(".log-output").addClass("hidden");
}

// Shows log and hides chat.
function showLog() {
    $(".chat-output").addClass("hidden");
    $(".log-output").removeClass("hidden");
}

function showGameStart() {
    $(".start-button").removeClass("hidden");
    $(".bet-button").addClass("hidden");
    $(".bet-input").addClass("hidden");
    $(".hit-button").addClass("hidden");
    $(".stay-button").addClass("hidden");
}

function showBetInputs() {
    $(".start-button").addClass("hidden");
    $(".bet-button").removeClass("hidden");
    $(".bet-input").removeClass("hidden");
    $(".hit-button").addClass("hidden");
    $(".stay-button").addClass("hidden");

}

function showHitStayInputs() {
    $(".start-button").addClass("hidden");
    $(".bet-button").addClass("hidden");
    $(".bet-input").addClass("hidden");
    $(".hit-button").removeClass("hidden");
    $(".stay-button").removeClass("hidden");
}

function hideGameInputs() {
    $(".start-button").addClass("hidden");
    $(".bet-button").addClass("hidden");
    $(".bet-input").addClass("hidden");
    $(".hit-button").addClass("hidden");
    $(".stay-button").addClass("hidden");
}

// Returns the appropriate status icon/text depending on
// the given status String.
function buildStatus(status) {
    let statusContainer = $("<div></div>");
    statusContainer.addClass("status-container");
    
    updateStatus(status, statusContainer);

    return statusContainer;
}

// Updates given DOM element containing player status
// to display given status represented as a String.
function updateStatus(status, statusContainer) {
    statusContainer.empty();
    let statusIcon = $("<img>");
    let statusText = $("<p></p>");

    statusIcon.addClass("status-icon");
    statusText.addClass("status-text");

    if (status === "unavailable" || status === "bust" || status == "lost") {
        statusIcon.attr({src: "img/red-x.png", alt: "red-x"});
    } else if (status === "ready" || status === "stay" || status === "won") {
        statusIcon.attr({src: "img/green-check.png", alt: "green-check"});
    } else {
        statusIcon.attr({src: "img/ellipsis.png", alt: "ellipsis"});
    }

    let capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    statusText.text(capitalizedStatus);

    statusContainer.append(statusIcon);
    statusContainer.append(statusText);
}

// Returns appropriate DOM element containing
// given amount of chips.
function buildChips(amount) {
    let chipContainer = $("<div></div>");
    chipContainer.addClass("chip-container");

    let chipIcon = $("<img>");
    chipIcon.addClass("chip-icon");
    chipIcon.attr({src: "img/poker-chip.png", alt: "chip-icon"});

    let chipText = $("<p></p>");
    chipText.addClass("chip-counter");
    chipText.text(amount);

    chipContainer.append(chipIcon);
    chipContainer.append(chipText);

    return chipContainer;
}

// Updates given DOM element containing amount of chips
// to display the given amount.
function updateChips(amount, chipContainer) {
    chipContainer.find("p").text(amount);
}

// Returns appropriate DOM element containing
// given cards represented by an array of Strings.
function buildCards(cardArray) {
    let cardContainer = $("<div></div>");
    cardContainer.addClass("card-container");
    updateCards(cardArray, cardContainer);

    return cardContainer;
}

// Empties given DOM element containing cards, and fills
// it with the cards in given array represented by Strings.
function updateCards(cardArray, cardContainer) {
    cardContainer.empty();
    for (let i = 0; i < cardArray.length; i++) {
        let cardType = cardArray[i];
        let card = $("<img>");
        card.addClass("card");

        card.attr("src", CARD_IMAGES[cardType]);

        if (cardType === "B") {
            card.attr("alt", "card-back");
        } else {
            card.attr("alt, card-front");
        }

        cardContainer.append(card);
    }
}