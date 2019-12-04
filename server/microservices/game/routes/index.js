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

const status = {};


app.route('/v1/Users/register')
  .patch((req, res) =>{
    if(!req.get('X-User')) {
        res.status(401).send("Unauthorized");	
        return;
    } 
    let aid = JSON.parse(req.get('X-User')).id;
    let uid = req.body.playerID;
    if( aid != uid){
        res.status(401).send("Unauthorized");
    } else{
        connection.query('UPDATE Users SET status = ? WHERE id = ?)', ["registered", uid], (err, results) =>{
            if(err)res.status(400).send("Bad request");
            res.status(201).send("Player registered")
        });
    }
    
  });

app.route('/v1/Users/:userid/unregister')
    .patch((req, res) =>{
        if(!req.get('X-User')) {
            res.status(401).send("Unauthorized");	
            return;
        } 
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.body.playerID;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        } else{
            connection.query('UPDATE Users SET status = ? WHERE id = ?', ["unregisted", userid], (err, results) =>{
                if(err)res.status(400).send("Bad request");
                res.status(201).send("Player Unregistered");
            });
        }
       
});

function getGameState(userid, gameid){
    return new Promise((reject, resolve) =>{
        let q = 'SELECT * FROM Users u \
        JOIN Games_Players gp ON u.id = gp.player_id \
        JOIN Games g ON g.id = gp.game_id \
        JOIN Users_Cards uc ON  u.id = uc.player_id \
        JOIN Cards c ON c.id = uc.card_id \
        WHERE u.id = ? AND g.ID = ? '

        connection.query(q, [userid, gameid], (err, results) => {
            if(results == undefined){
                reject(err)
            } else{
                resolve(results[0])
            }

        });
    });
  
}


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

           getGameState(userid, gameid).then((value)=>{
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
           });

        }    
})

app.route('/v1/Games/Users/stand')
    .patch((req, res) => {
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

            getGameState(userid, gameid).then((value)=>{
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
           });

        }
    })

function randomCard(){
    return new Promise((reject, resolve) =>{
        let r = 'select round(rand() * 51)'
        connection.query('SELECT * FROM CARDS WHERE id = ?', r, (err, results) =>{
            if(results == undefined){
                reject(err)
            } else{
                resolve(results[0])
            }
        })
    })
}

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

            getGameState(userid, gameid).then((value)=>{
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
           });
        }
    })


  module.exports = app;