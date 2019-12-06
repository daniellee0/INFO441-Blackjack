"use strict";
const express = require("express");
const mysql = require("mysql");
const app = express();

let connection = mysql.createConnection({
    host     : 'localhost',
    user     : "root",
    password : "pass",
    database : "blackjack"
  });

const game_state =[];


function insertIntoGamesPlayers(gp){
        connection.query('INSERT INTO Games_Players SET ?', gp, (err, results) =>{
           if(err) return;
        })
}

function randomCard(){
    return new Promise(function (resolve, reject){
        connection.query('select * from Cards Order by rand() limit 1',  (err, results) =>{
            if(results == undefined){
                reject(err);
            } else{
                resolve(results[0]);
            }
        });
    });
}

function insertIntoUsersCards(uc){
    connection.query('INSERT INTO Users_Cards SET ?', uc, (err, results) =>{
        if(err) return;
    });
}

function checkDealerHand(){
    return new Promise ( (resolve, reject) =>{
        connection.query('SELECT COUNT(*) AS count FROM Users_Cards WHERE player_id = ?', 1, (err,results) =>{
            if(err != null){
                reject(err);
            } else{
                resolve(results[0]);
            }
        })
    })

}

function getGameState(){
    return new Promise((resolve, reject) =>{
        let q = 'SELECT * FROM Users u \
        JOIN Games_Players gp ON u.id = gp.player_id \
        JOIN Games g ON g.id = gp.game_id \
        JOIN Users_Cards uc ON  u.id = uc.player_id \
        JOIN Cards c ON c.id = uc.card_id'

        connection.query(q, (err, results) => {
            if(results == undefined){
                console.log(err)
                reject(err)
            } else{
                // console.log(results);
                resolve(results)
            }
        });
    });
}

app.route('/v1/Users/register')
  .post((req, res) =>{
   
    let user = {
        "email": req.body.email,
        "passhash": req.body.passhash, 
        "username": req.body.first_name,
        "first_name": req.body.first_name,
        "last_name": req.body.last_name,
        "chips": req.body.chips,
    }
    
    connection.query('INSERT INTO Users SET ?', user, (err, results) =>{
        if(err){ 
            // if(err)res.status(400).send("Bad request");
            getGameState().then((value)=>{
            
                value.forEach((element) => {
                    console.log(element.player_id)
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
                
                console.log(game_state)
                res.json(game_state)
              
            }).catch(function(err){
            console.log("Promise rejection error: "+err);
            res.status(400).send("Bad request");  
            })
        } else{
            let id = results.insertId;
            randomCard().then(function(value){
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
    
            }).catch((err) =>{
                console.log("err" + err);
            });
        }
  
    });

        checkDealerHand().then((value) =>{
            if(value.count == 0){
                randomCard().then(function(value){
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
    
                }).catch((err) =>{
                    console.log("err" + err);
                });
            }
        }).catch((err) =>{
            console.log("err" + err);
        });
        getGameState().then((value)=>{
            
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
          
        }).catch(function(err){
        console.log("Promise rejection error: "+err);
        res.status(400).send("Bad request");  
        })

  });


app.route('/v1/Users/unregister')
    .delete((req, res) =>{
        if(!req.get('X-User')) {
            res.status(401).send("Unauthorized");	
            return;
        } 
        let uid = JSON.parse(req.get('X-User')).id;
        console.log(uid)
        connection.query('DELETE FROM Users WHERE id = ?', uid, (err, results) =>{
            console.log(err);
                if(err)res.status(400).send("Bad request");
        });
        connection.query('DELETE FROM Games_Players WHERE player_id = ?', uid, (err, results) =>{
            if(err)res.status(400).send("Bad request");
        });
        connection.query('DELETE FROM Users_Cards WHERE player_id = ?', uid, (err, results) =>{
            if(err)res.status(400).send("Bad request");
        });
        getGameState().then((value)=>{
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
        }).catch(function(err){
        console.log("Promise rejection error: "+err);
            res.status(400).send("Bad request");  
        })  
});




app.route('/v1/Games/Users/bet')
    .patch((req, res) =>{
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.body.playerID;
        let gameid = req.body.gameID;
        let game_state = req.body.type;
        let bet = req.body.text;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        } else {
            connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [game_state, gameid], (err, results) =>{
                if(err) return res.status(400).send("Bad request");
            });

            connection.querty('UPDATE Users SET chips = ? WHERE id = ?', [bet, userid], (err, results) =>{
                if(err) return res.status(400).send("Bad request");
            });

           getGameState().then((value)=>{
                status[gameState] = value.game_state,
                status[players] = {
                    playerName: value.first_name,
                    playerID: value.id,
                    status: value.status,
                    chips: value.chips,
                    cards: value.card_name
                }
                res.set("Content-Type", "application/json");
                res.json(status);
           }).catch(function(err){
            console.log("Promise rejection error: "+err);
            res.status(400).send("Bad request");  
          })

        }    
})

app.route('/v1/Games/Users/stand')
    .patch((req, res) => {
        let authid = JSON.parse(req.get('X-User')).id;
        let data = req.body
        let userid = data.playerID;
        let gameid = data.gameID;
        let game_state = data.type;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        } else {
            connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [game_state, gameid], (err, results) =>{
                if(err) return res.status(400).send("Bad request");
            });

            getGameState().then((value)=>{
                status[gameState] = value.game_state,
                status[players] = {
                    playerName: value.first_name,
                    playerID: value.id,
                    status: value.status,
                    chips: value.chips,
                    cards: value.card_name
                }
                res.set("Content-Type", "application/json");
                res.json(status);
           }).catch(function(err){
            console.log("Promise rejection error: "+err);
            res.status(400).send("Bad request");  
          })

        }
    })



function getCurrentHand(id){
    return new Promise((reject, resolve) => {
        connection.query('SELECT * FROM Games_Players WHERE player_id  = ?', id, (err, results) =>{
            if(results == undefined){
                reject(err)
            } else{
                resolve(results[0])
            }
        })

    })
}



app.route('/v1/Games/Users/hit')
    .patch((req, res) =>{
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.body.playerID;
        let gameid = req.body.gameID;
        let game_state = req.body.type;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        } else {
            connection.query('UPDATE Games SET game_state = ? WHERE id = ?', [game_state, gameid], (err, results) =>{
                if(err) return res.status(400).send("Bad request");
            });
            randomCard().then((value) =>{
                let val = value.card_value;
                connection.query('INSERT INTO Users_Cards (player_id, card_id) VALUES (?, ?)', [userid, value.id], (err, results) =>{
                    if(err) return res.status(400).send("Bad request");
                });
                getCurrentHand(userid).then((value) =>{
                    let oldVal = value.hand_value;
                    let newVal = val + oldVal;
                    connection.query('UPDATE Games_Players SET hand_value = ? WHERE player_id = ?', [newVal, userid], (err, results)=>{
                        if(err) return res.status(400).send("Bad request");
                    })
                })
              
            });

            getGameState().then((value)=>{
                status[gameState] = value.game_state,
                status[players] = {
                    playerName: value.first_name,
                    playerID: value.id,
                    status: value.status,
                    chips: value.chips,
                    cards: value.card_name
                }
                res.set("Content-Type", "application/json");
                res.json(status);
           }).catch(function(err){
            console.log("Promise rejection error: "+err);
            res.status(400).send("Bad request");  
          })
        }
    })


  module.exports = app;