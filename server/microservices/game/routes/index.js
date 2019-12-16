"use strict";
const express = require("express");
const mysql = require("mysql");
const sendToMQ = require('../queueMessage');
const app = express();

let connection = mysql.createConnection({
    host     : 'blackjackmysql',
    user     : "root",
    password : "password",
    database : "blackjackmysqldb"
  });



// app.route('/v1/Games/Users/bet')
app.route('/v1/games/:GameID/users/:UserID/bet')
    .post((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
            return;
        }
        
        let gameID = parseInt(req.params.GameID);
        let userID = parseInt(req.params.UserID);      // Or get userID from the X-User
        let betAmount = req.body.BetAmount;             // should be an integer
        if (betAmount == null || betAmount < 1) {
            res.status(400).send("Bad request: must bet a value greater than 0"); 
            return;
        }
        let uid = JSON.parse(req.get('X-User')).id;
        if (uid != userID) {
            if (err) {
                res.status(403).send("Forbidden");
                return;
            }
        }
        // Player must have valid amount of chips to bet
        connection.query('SELECT chips FROM Users WHERE id=?', userID, (err, results) => {
            if (err) {
                res.status(400).send("Bad request");
                return;
            }
            if (results[0].chips < betAmount) {
                res.status(400).send("Bad request");
                return;
            }
            // Game state must be in betting to place a bet
            connection.query('SELECT game_state FROM Games WHERE id=?', gameID, (err, results) => {
                if (err) {
                    res.status(400).send("Bad request");
                    return;
                }
                if (results[0].game_state != "betting") {
                    res.status(400).send("Bad request: You cannot currently bet.");
                    return;
                }

                // Update bet amount and status 
                connection.query('UPDATE Games_Players SET bet_amount = ?, status = ? WHERE player_id = ?', [betAmount, "ready", userID], (err, results) => {
                    if (err) {
                        console.log(err);
                        res.status(400).send("Bad request: couldn't update bet amount");
                        return;
                    }
                });
        
                // Update chips 
                connection.query('UPDATE Users SET chips = chips - ? WHERE id = ?', [betAmount, userID], (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(400).send("Bad request: couldn't update chips");
                        return;
                    }
                });
        
                // Check status of other players
                updateGameStateBet(res, req, gameID);
                sendBetUpdateMessage(res, gameID, userID, req);
            });
        });
    
    })

app.route('/v1/games/:GameID/users/:UserID/stand')
    .post((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
            return;
        }
        
        let gameID = parseInt(req.params.GameID);
        let userID = parseInt(req.params.UserID);

        // Gamestate must be in deciding to make this choice
        connection.query('SELECT game_state FROM Games WHERE id = ?', gameID, (err, results) => {
            if (err) {
                res.status(400).send("Bad request");
                return;
            }
            if (results[0].game_state != "deciding") {
                res.status(400).send("Bad request");
                return;
            }

            // Update status to be stopped for the player
            connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ?', ["stopped", userID], (err, results) => {
                if (err) {
                    res.status(400).send("Bad request");
                    return;
                };

                // Send updated status message for all users 
                connection.query('SELECT * FROM Games_Players WHERE game_id = ? AND NOT player_id = 1', gameID, (err, results) => {
                    if(err) {
                        res.status(400).send("Bad request: couldn't update players");
                        return;
                    };
                    var userIDs = [];
                    for (var i = 0; i < results.length; i++) {
                        userIDs.push(results[i].player_id);
                    }

                    // Send message with updated status
                    let data = {
                        type: "status-update",
                        id: userID,
                        status: "stopped",
                        userIDs: userIDs
                    }
                    sendToMQ(req, data);

                    updateHouseState(results, gameID, req);
                    res.status(201).send("Successfully stood");
                });
            });
        // Update house state
        });
    });

app.route('/v1/games/:GameID/users/:UserID/hit')
    .post((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
        }
        let gameID = parseInt(req.params.GameID);
        let userID = parseInt(req.params.UserID);


        // Gamestate must be in deciding to make this choice
        connection.query('SELECT game_state FROM Games WHERE id = ?', gameID, (err, results) => {
            if (err) {
                res.status(400).send("Bad request");
                return;
            }
            if (results[0].game_state != "deciding") {
                res.status(400).send("Bad request");
                return;
            }
            // User must not have a stopped state
            connection.query('SELECT status FROM Games_Players WHERE player_id = ? AND game_id = ?', [userID, gameID], (err, results) => {
                if (err) {
                    res.status(400).send("Bad request");
                    return;
                }
                if (results[0].status == "stopped") {
                    res.status(400).send("Bad request");
                    return;
                }
                // Insert new card
                var cardID = Math.floor(Math.random() * (52 - 1)) + 1;
                connection.query('INSERT INTO Users_Cards (player_id, card_id) VALUES (?,?)', [userID, cardID], (err, results) => {
                    if(err) {
                        res.status(400).send("Bad request: couldn't update players");
                        return;
                    };
                    // Calculate hand value to determine status
                    connection.query('SELECT uc.player_id, c.card_name, c.card_value FROM Cards c JOIN Users_Cards uc ON c.id = uc.card_id WHERE uc.player_id = ?', userID, (err, results) => {
                        if(err) {
                            res.status(400).send("Bad request: couldn't update players");
                            return;
                        };
                        var handValue = 0;
                        var hasAce = false;
                        var aceValue = 1;
                        for (var l = 0; l < results.length; l++) {
                            if (results[l].card_value == "A") {
                                hasAce = true;
                                if (handValue + 11 <= 21) {
                                    aceValue = 11;
                                } else if (handValue + 11 > 21) {
                                    aceValue = 1;
                                }
                                handValue += aceValue;
                            } else {
                                if (handValue + parseInt(results[l].card_value) > 21 && hasAce && aceValue == 11) {
                                    aceValue = 1;
                                    handValue -= 10;
                                }
                                handValue += parseInt(results[l].card_value);
                            }
                        }
                        
                        var userIDs = [];
                        for (var j = 0; j < results.length; j++) {
                            userIDs.push(results[j].player_id);
                        }
                        // Send new card message
                        var cards = [];
                        connection.query('SELECT * FROM Cards WHERE id = ?', cardID, (err, results) => {
                            if(err) {
                                res.status(400).send("Bad request: couldn't update players");
                                return;
                            };
                            // Add new card to the cards and send message to client
                            cards.push(results[0].card_name);
                            var cardData = {
                                type: "card-new",
                                id: userID,
                                cards: cards,
                                userIDs: userIDs
                            }
                            sendToMQ(req, cardData);
                        });
                        if (handValue >= 21) {
                            connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ?', ["stopped", userID], (err, results) => {
                                if(err) {
                                    res.status(400).send("Bad request: couldn't update players");
                                    return;
                                };
                                // Send message with updated status
                                let data = {
                                    type: "status-update",
                                    id: userID,
                                    status: "stopped",
                                    userIDs: userIDs
                                }
                                sendToMQ(req, data);
                                // Attempt to update the house state
                                connection.query('SELECT game_id, player_id, status, bet_amount FROM Games_Players WHERE game_id = ? AND NOT player_id = 1', gameID, (err, results) => {
                                    if(err) {
                                        res.status(400).send("Bad request: couldn't update players");
                                        return;
                                    };
                                    updateHouseState(results, gameID, req);
                                });
                            });
                        } else {
                            res.status(201).send("Successfully hit");
                            return;
                        }
                    });
                });
            });
        });
    });


app.route('/v1/users/unregister/:UserID')
    .post((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
        }
        let userID = parseInt(req.params.UserID);

        connection.query("DELETE FROM Users_Cards WHERE player_id = ?", userID, (err, results) => {
            if(err) {
                res.status(400).send("Bad request: couldn't update the game state");
                return;
            };
            connection.query("DELETE FROM Games_Players WHERE player_id = ?", userID, (err, results) => {
                if(err) {
                    res.status(400).send("Bad request: couldn't update the game state");
                    return;
                };
                connection.query('SELECT * FROM Games_Players', (err, results) => {
                    var userIDs = [];
                    for (var j = 0; j < results.length; j++) {
                        userIDs.push(results[j].player_id);
                    }
                    
                    var data = {
                        type: "player-delete",
                        id: userID,
                        userIDs: userIDs
                    }

                    sendToMQ(req, data);
                })
            })
        });
    });

function updateGameStateBet(res, req, gameID){
    // All players must be ready to distribute cards
    connection.query('SELECT player_id, status FROM Games_Players WHERE game_id = ? AND NOT player_id = ?', [gameID, 1], (err, results) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update the game state");
            return;
        };
        for (var i = 0; i < results.length; i++) {
            if (results[i].status != "ready") {
                ready = false;
                return;
            }
        }        
        // Update game state from ready to deciding
        connection.query('UPDATE Games SET game_state = ? WHERE id = ?', ["deciding", gameID], (err, results) =>{
            if(err) {
                console.log(err);
                res.status(400).send("Bad request: couldn't update the game state");
                return;
            };
        });
        // Distribute 2 cards for players but not the house
        connection.query('SELECT * FROM Games_Players WHERE game_id = ? AND NOT player_id = 1', gameID, (err, results) => {
            if(err) {
                console.log(err);
                res.status(400).send("Bad request: couldn't update players");
                return;
            };
            var userIDs = [];
            for (var i = 0; i < results.length; i++) {
                userIDs.push(results[i].player_id);
            }

            // Insert two cards for each user
            for (var i = 0; i < results.length; i++) {
                var cardID1 = Math.floor(Math.random() * (52 - 1)) + 1;
                var cardID2 = Math.floor(Math.random() * (52 - 1)) + 1;
                connection.query('INSERT INTO Users_Cards (player_id, card_id) VALUES (?,?), (?,?)', [results[i].player_id, cardID1, results[i].player_id, cardID2], (err, results) => {
                    if(err) {
                        console.log(err);
                        res.status(400).send("Bad request: couldn't update players");
                        return;
                    };
                });

                // Send message with new cards
                sendNewCardMessage(res, req, results[i].player_id, userIDs, cardID1, cardID2);
            }
        });
    });

}

function updateHouseState(players, gameID, req) {
    connection.query('SELECT player_id, status FROM Games_Players WHERE game_id = ? AND NOT player_id = ?', [gameID, 1], (err, results) => {
        for (var i = 0; i < results.length; i++) {
            if (results[i].status != "stopped") {
                // Do nothing if one player isn't stopped
                return;
            }
        }
        // All players have stopped: handValue > 21 or have chosen to stand
        // Distribute house cards and determine winners
        var houseHandValue = 0;
        var hasAce = false;
        var aceValue = 1;
        // Draw cards until houseHandValue is greater than 17
        addHouseCards(players, hasAce, aceValue, houseHandValue, req);
            
    });
    
}

function addHouseCards(players, hasAce, aceValue, houseHandValue, req) {
    var cardID = Math.floor(Math.random() * (52 - 1)) + 1;
    connection.query('INSERT INTO Users_Cards (player_id, card_id) VALUES (?,?)', [1, cardID], (err, results) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
    });
    // Add card value to houseHandValue for house
    connection.query('SELECT card_name, card_value FROM Cards WHERE id = ?', cardID, (err, results) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
        if (results[0].card_value == "A") {
            hasAce = true;
            if (houseHandValue + 11 <= 21) {
                aceValue = 11;
            } else if (houseHandValue + 11 > 21) {
                aceValue = 1;
            }
            houseHandValue += aceValue;
        } else {
            if (houseHandValue + parseInt(results[0].card_value) > 21 && hasAce && aceValue == 11) {
                aceValue = 1;
                houseHandValue -= 10;
            }
            houseHandValue += parseInt(results[0].card_value);
        }

        var userIDs = [];
        for (var j = 0; j < players.length; j++) {
            userIDs.push(players[j].player_id);
        }
        var cards = [];
        cards.push(results[0].card_name);
        let data = {
            type: "card-new",
            id: 1,
            userIDs: userIDs,
            cards: cards
        }
        sendToMQ(req, data);
        if (houseHandValue < 17) {
            addHouseCards(players, hasAce, aceValue, houseHandValue, req);
        } else {
            // Determine winners 
            handleWinners(players, houseHandValue, req, userIDs);
        }
    });
}

function handleWinners(players, houseHandValue, req, userIDs) {
// Determine winners 
for (var i = 0; i < players.length; i++) {
    var playerID = players[i].player_id;
    var betAmount = players[i].bet_amount;
    connection.query('SELECT c.card_name, c.card_value FROM Users_Cards uc JOIN Cards c on uc.card_id=c.id WHERE uc.player_id = ?', players[i].player_id, (err, results) => {
        if(err) {
            console.log(err);
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
        var handValue = 0;
        var hasAce = false;
        var aceValue = 1;
        // Calculate hand value
        for (var j = 0; j < results.length; j++) {
            if (results[j].card_value == "A") {
                hasAce = true;
                if (handValue + 11 <= 21) {
                    aceValue = 11;
                } else if (handValue + 11 > 21) {
                    aceValue = 1;
                }
                handValue += aceValue;
            } else {
                if (handValue + parseInt(results[j].card_value) > 21 && hasAce && aceValue == 11) {
                    aceValue = 1;
                    handValue -= 10;
                }
                handValue += parseInt(results[j].card_value);
            }
        }

        // Add/subtract from chips if the player won/lost
        if (handValue <= 21 && handValue > houseHandValue) {
            // Player has valid hand and is greater in value than the house: player won
            updatePlayerChips(playerID, betAmount, "won");
            sendGameMessageResult(req, playerID, userIDs, "won");
        } else if (handValue <= 21 && houseHandValue > 21) {
            // Player has valid hand and the house overdrew: player won
            updatePlayerChips(playerID, betAmount, "won");
            sendGameMessageResult(req, playerID, userIDs, "won");
        } else if (handValue == houseHandValue) {
            // Player has matching hand with house: tie
            updatePlayerChips(playerID, betAmount, "tie");
            sendGameMessageResult(req, playerID, userIDs, "tie");
        } else if (handValue > 21 && houseHandValue > 21) {
            // Player and house have overdrawn: tie
            updatePlayerChips(playerID, betAmount, "tie");
            sendGameMessageResult(req, playerID, userIDs, "tie");
        } else {
            // Player lost otherwise, do nothing
            sendGameMessageResult(req, playerID, userIDs, "lost");
        }

        // Round ended: update player status to betting 
        connection.query('UPDATE Games_Players SET status = "betting", bet_amount = 0 WHERE player_id = ?', playerID, (err, result) => {
            if(err) {
                console.log(err);
                res.status(400).send("Bad request: couldn't update players");
                return;
            };
        });

        // Round ended: delete players cards
        connection.query('DELETE FROM Users_Cards WHERE NOT card_id = 53', (err, result) => {
            if(err) {
                console.log(err);
                res.status(400).send("Bad request: couldn't delete cards");
                return;
            };
        });

        // Round ended: update game state to betting
        connection.query('UPDATE Games SET game_state = ? WHERE id = ?', ["betting", 1], (err, result) => {
            if(err) {
                console.log(err);
                res.status(400).
                send("Bad request: couldn't delete cards");
                return;
            };
        });
    });
}
}

function sendGameMessageResult(req, playerID, userIDs, result) {
    connection.query('SELECT * FROM Users WHERE id = ?', playerID, (err, results) => {
        if (err) {
            res.status(400).
            send("Bad request");
            return;
        };
        let data = {
            type: "message-result",
            id: playerID,
            username: results[0].username,
            userIDs: userIDs,
            chips: results[0].chips,
            result: result
        }
        sendToMQ(req, data);
    });
}


function updatePlayerChips(playerID, betAmount, gameResult) {
    var updateQuery = "";
    if (gameResult == "won") {
        updateQuery = 'UPDATE Users SET chips = chips + (2 * ?) WHERE id = ?';
    } else if (gameResult == "tie") {
        updateQuery = 'UPDATE Users SET chips = chips + ? WHERE id = ?';
    }
    connection.query(updateQuery, [betAmount, playerID], (err, result) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
    });
}


function updatePlayerState(players, gameID) {
    for (var i = 0; i < players.length; i++) {
        // Calculate hand_value of a players cards and update status
        connection.query('SELECT c.card_name, c.card_value FROM Users_Cards uc JOIN Cards c on uc.card_id=c.id WHERE uc.player_id = ?', players[i].player_id, (err, results) => {
            if(err) {
                res.status(400).send("Bad request: couldn't update players");
                return;
            };
            var handValue = 0;
            var hasAce = false;
            var aceValue = 1;
            // Calculate hand value
            for (var j = 0; j < results.length; j++) {
                if (results[j].card_value == "A") {
                    hasAce = true;
                    if (handValue + 11 <= 21) {
                        aceValue = 11;
                    } else if (handValue + 11 > 21) {
                        aceValue = 1;
                    }
                    handValue += aceValue;
                } else {
                    if (handValue + parseInt(results[j].card_value) > 21 && hasAce && aceValue == 11) {
                        aceValue = 1;
                        handValue -= 10;
                    }
                    handValue += parseInt(results[j].card_value);
                }
            }
            // Update player status based on hand value
            if (handValue >= 21) {
                connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ? AND game_id', ["stopped", players[i].player_id, gameID], (err, results) => {
                    if(err) {
                        res.status(400).send("Bad request: couldn't update players");
                        return;
                    };
                    // send message with new status and cards
                });
            } else {
                connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ? AND game_id', ["deciding", players[i].player_id, gameID], (err, results) => {
                    if(err) {
                        res.status(400).send("Bad request: couldn't update players");
                        return;
                    };
                    // send message with new status and cards 
                });
            }
        });
    }
}

function sendBetUpdateMessage(res, gameID, userID, req) {
    connection.query('SELECT u.id, u.username, u.chips, gp.status FROM Users u JOIN Games_Players gp on u.id = gp.player_id WHERE player_id = ? AND game_id = ?', [userID, gameID], (err, results) => {
        if(err) {
            res.status(400).send("Bad request: couldn't find matching rows");
            return;
        };
        sendBetToPlayers(res, results[0], gameID, req);
        res.status(201).send("Successfully bet");
    });
}

function sendNewCardMessage(res, req, playerID, userIDs, cardID1, cardID2) {
    connection.query('SELECT card_name FROM Cards WHERE id = ? OR id = ?', [cardID1, cardID2], (err, cardResults) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
        var cards = [];
        for (var j = 0; j < cardResults.length; j++) {
            cards.push(cardResults[j].card_name);
        }
        let data = {
            type: "card-new",
            id: playerID,
            cards: cards,
            userIDs: userIDs
        }

        sendToMQ(req, data);
    });

}

function sendBetToPlayers(res, info, gameID, req) {
    connection.query('SELECT player_id FROM Games_Players WHERE game_id = ? AND NOT player_id = 1', gameID, (err, results) => {
        if(err) {
            res.status(400).send("Bad request: couldn't update players");
            return;
        };
        let userIds = [];
        for (var i = 0; i < results.length; i++) {
            // Don't include the house
            userIds.push(results[i].player_id);
        }

        let data = {
            type: "bet-new",
            id: info.id,
            username: info.username,
            chips: info.chips,
            status: info.status,
            userIDs: userIds
        }
        sendToMQ(req, data);
    });
}

module.exports = app;