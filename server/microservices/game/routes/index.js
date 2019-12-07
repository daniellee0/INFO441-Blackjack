"use strict";
const express = require("express");
const mysql = require("mysql");
const app = express();

let connection = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "pass",
    database: "blackjack"
});

const game_state = [];


function insertIntoGamesPlayers(gp) {
    connection.query('INSERT INTO Games_Players SET ?', gp, (err, results) => {
        if (err) return;
    });
}

function randomCard() {
    return new Promise(function (resolve, reject) {
        connection.query('select * from Cards Order by rand() limit 1', (err, results) => {
            if (results == undefined) {
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
}

function insertIntoUsersCards(uc) {
    connection.query('INSERT INTO Users_Cards SET ?', uc, (err, results) => {
        if (err) return;
    });
}

function getCurrentHand(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM Games_Players WHERE player_id = ?', id, (err, results) => {
            if (results == undefined) {
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
}

function checkDealerHand() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) AS count FROM Users_Cards WHERE player_id = ?', 1, (err, results) => {
            if (err != null) {
                reject(err);
            } else {
                resolve(results[0]);
            }
        });
    });
}

function updateGamesPlayers(gp) {
    connection.query('UPDATE Games_Players SET ? WHERE player_id =?', [gp, gp.player_id], (err, results) => {
        if (err) return;
    });
}


function getGameState() {
    return new Promise((resolve, reject) => {
        let q = 'SELECT g.game_state, u.username, uc.player_id, gp.status, u.chips, JSON_ARRAYAGG(c.card_name) AS cards \
                FROM Users u \
                JOIN Games_Players gp ON u.id = gp.player_id \
                JOIN Games g ON g.id = gp.game_id \
                JOIN Users_Cards uc ON  u.id = uc.player_id \
                JOIN Cards c ON c.id = uc.card_id  \
                GROUP BY g.game_state, u.username, uc.player_id, gp.status, u.chips'

        connection.query(q, (err, results) => {
            if (results == undefined) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}



app.route('/v1/Users/register')
    .post((req, res) => {
        let user = {
            "email": req.body.email,
            "passhash": req.body.passhash,
            "username": req.body.first_name,
            "first_name": req.body.first_name,
            "last_name": req.body.last_name,
            "chips": req.body.chips,
        }
        connection.query('INSERT INTO Users SET ?', user, (err, results) => {
            if (err) {
                res.status(400).send("Bad request");
            } else {
                let id = results.insertId;
                randomCard().then(function (value) {
                    let uc = {
                        "player_id": id,
                        "card_id": value.id
                    }
                    insertIntoUsersCards(uc);
                    let gp = {
                        "game_id": 1,
                        "player_id": id,
                        "status": "ready",
                        "hand_value": value.card_value
                    }
                    insertIntoGamesPlayers(gp);
                }).catch((err) => {
                    res.status(400).send("Bad request");
                });
                checkDealerHand().then((value) => {
                    if (value.count == 0) {
                        randomCard().then(function (value) {
                            let uc = {
                                "player_id": 1,
                                "card_id": value.id
                            }
                            insertIntoUsersCards(uc);
                            let gp = {
                                "game_id": 1,
                                "player_id": 1,
                                "status": "ready",
                                "hand_value": value.card_value
                            }
                            insertIntoGamesPlayers(gp);
                        }).catch((err) => {
                            res.status(400).send("Bad request");
                        });
                    }
                }).catch((err) => {
                    res.status(400).send("Bad request");
                });
                getGameState().then((value) => {
                    value.forEach((element) => {
                        let status = {}
                        status["gameState"] = element.game_state,
                            status["players"] = {
                                "playerName": element.username,
                                "playerID": element.player_id,
                                "status": element.status,
                                "chips": element.chips,
                                "cards": element.card_name
                            }
                        game_state.push(status)
                    });
                    res.json(game_state)
                }).catch(function (err) {
                    res.status(400).send("Bad request");
                });
            }
        });
    });


app.route('/v1/Users/unregister')
    .delete((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
            return;
        }
        let uid = JSON.parse(req.get('X-User')).id;
        console.log(uid)
        connection.query('DELETE FROM Users WHERE id = ?', uid, (err, results) => {
            console.log(err);
            if (err) res.status(400).send("Bad request");
        });
        connection.query('DELETE FROM Games_Players WHERE player_id = ?', uid, (err, results) => {
            if (err) res.status(400).send("Bad request");
        });
        connection.query('DELETE FROM Users_Cards WHERE player_id = ?', uid, (err, results) => {
            if (err) res.status(400).send("Bad request");
            getGameState().then((value) => {
                value.forEach((element) => {
                    let status = {}
                    status["gameState"] = element.game_state,
                        status["players"] = {
                            "playerName": element.username,
                            "playerID": element.player_id,
                            "status": element.status,
                            "chips": element.chips,
                            "cards": element.card_name
                        }
                    game_state.push(status)
                });
                res.json(game_state)
            }).catch(function (err) {
                res.status(400).send("Bad request");
            });
        });
    });




app.route('/v1/Games/Users/bet')
    .patch((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
            return;
        }
        let uid = JSON.parse(req.get('X-User')).id;
        let gameid = 1;
        let gs = "betting";
        let bet = req.body.text;
        if (uid == 1) {
            connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [gs, gameid], (err, results) => {
                if (err) return res.status(400).send("Bad request");
            });
        } else {
            connection.query('UPDATE Users SET chips = ? WHERE id = ?', [bet, uid], (err, results) => {
                if (err) return res.status(400).send("Bad request");
            });
            connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ?', [gs, uid], (err, results) => {
                if (err) return res.status(400).send("Bad request");
            });
        }
        getGameState().then((value) => {
            value.forEach((element) => {
                let status = {}
                status["gameState"] = element.game_state,
                    status["players"] = {
                        "playerName": element.username,
                        "playerID": element.player_id,
                        "status": element.status,
                        "chips": element.chips,
                        "cards": element.cards
                    }
                game_state.push(status)
            });
            res.json(game_state)
        }).catch(function (err) {
            res.status(400).send("Bad request");
        })

    })

app.route('/v1/Games/Users/stand')
    .patch((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
            return;
        }
        let uid = JSON.parse(req.get('X-User')).id;
        let gs = "standing";
        let count = 0;
        if (uid == 1) {
            getGameState().then((value) => {
                value.forEach((element) => {
                    if (element.status === gs) {
                        count++;
                    }
                });
            }).catch(function (err) {
                console.log("Promise rejection error: " + err);
                res.status(400).send("Bad request");
            });
            if (count == 6) {
                // console.log(count);
                connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [gs, uid], (err, results) => {
                    if (err) return res.status(400).send("Bad request");

                });
                connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ?', [gs, uid], (err, results) => {
                    if (err) return res.status(400).send("Bad request");

                });

                getCurrentHand(uid).then((value) => {
                    let currentHandValue = value.hand_value;
                    if (currentHandValue >= 17) {
                        getGameState().then((value) => {
                            value.forEach((element) => {
                                let status = {}
                                status["gameState"] = element.game_state,
                                    status["players"] = {
                                        "playerName": element.username,
                                        "playerID": element.player_id,
                                        "status": element.status,
                                        "chips": element.chips,
                                        "cards": element.cards
                                    }

                                game_state.push(status)
                            });
                            res.json(game_state)

                        }).catch(function (err) {
                            console.log("Promise rejection error: " + err);
                            res.status(400).send("Bad request");
                        })
                    } else {
                        randomCard().then(function (value) {
                            // console.log(value.card_value);
                            let randomCardValue = "A";
                            if (randomCardValue == "A") {
                                let v = Math.floor(Math.random() * 2 + 1)
                                if (v == 1) {
                                    randomCardValue = 1;
                                } else {
                                    randomCardValue = 11;
                                }
                            }
                            let uc = {
                                "player_id": uid,
                                "card_id": value.id
                            }
                            insertIntoUsersCards(uc);
                            getCurrentHand(uid).then((value) => {
                                let currentHandValue = value.hand_value;
                                let newHandValue = currentHandValue + randomCardValue;
                                let gp = {
                                    "game_id": 1,
                                    "player_id": uid,
                                    "status": gs,
                                    "hand_value": newHandValue
                                }
                                updateGamesPlayers(gp);
                                getGameState().then((value) => {
                                    value.forEach((element) => {
                                        let status = {}
                                        status["gameState"] = element.game_state,
                                            status["players"] = {
                                                "playerName": element.username,
                                                "playerID": element.player_id,
                                                "status": element.status,
                                                "chips": element.chips,
                                                "cards": element.cards
                                            }

                                        game_state.push(status)
                                    });
                                    res.json(game_state)

                                }).catch(function (err) {
                                    console.log("Promise rejection error: " + err);
                                    res.status(400).send("Bad request");
                                })
                            })
                        }).catch((err) => {
                            console.log("err" + err);
                        });
                    }
                })


            }

        } else {
            connection.query('UPDATE Games_Players SET status = ? WHERE player_id = ?', [gs, uid], (err, results) => {
                if (err) return res.status(400).send("Bad request");

            });
        }
        getGameState().then((value) => {
            value.forEach((element) => {
                let status = {}
                status["gameState"] = element.game_state,
                    status["players"] = {
                        "playerName": element.username,
                        "playerID": element.player_id,
                        "status": element.status,
                        "chips": element.chips,
                        "cards": element.cards
                    }

                game_state.push(status);
            });
            res.json(game_state);

        }).catch(function (err) {
            res.status(400).send("Bad request");
        });
    })

app.route('/v1/Games/Users/hit')
    .patch((req, res) => {
        if (!req.get('X-User')) {
            res.status(401).send("Unauthorized");
        }
        let uid = JSON.parse(req.get('X-User')).id;
        let gameid = 1;
        let gs = "hitting";
        if (uid == 1) {
            connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [gs, gameid], (err, results) => {
                console.log(err)
                if (err) return res.status(400).send("Bad request");
            });
        } else {
            randomCard().then(function (value) {
                // console.log(value.card_value);
                let randomCardValue = "A";
                if (randomCardValue == "A") {
                    let v = Math.floor(Math.random() * 2 + 1)
                    if (v == 1) {
                        randomCardValue = 1;
                    } else {
                        randomCardValue = 11;
                    }
                }
                let uc = {
                    "player_id": uid,
                    "card_id": value.id
                }
                insertIntoUsersCards(uc);
                getCurrentHand(uid).then((value) => {
                    let currentHandValue = value.hand_value;
                    let newHandValue = currentHandValue + randomCardValue;
                    let gp = {
                        "game_id": 1,
                        "player_id": uid,
                        "status": gs,
                        "hand_value": newHandValue
                    }
                    updateGamesPlayers(gp);
                    getGameState().then((value) => {
                        value.forEach((element) => {
                            let status = {}
                            status["gameState"] = element.game_state,
                                status["players"] = {
                                    "playerName": element.username,
                                    "playerID": element.player_id,
                                    "status": element.status,
                                    "chips": element.chips,
                                    "cards": element.cards
                                }

                            game_state.push(status)
                        });
                        res.json(game_state)

                    }).catch(function (err) {
                        console.log("Promise rejection error: " + err);
                        res.status(400).send("Bad request");
                    })
                })
            }).catch((err) => {
                console.log("err" + err);
            });
        }
    });


module.exports = app;