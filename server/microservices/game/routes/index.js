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

            let q = 'SELECT * FROM Users u \
             JOIN Games_Players gp ON u.id = gp.player_id \
             JOIN Games g ON g.id = gp.game_id \
             WHERE u.id = ? AND g.ID = ? '

             connection.query(q, [userid, gameid], (err, results) => {
                if(err) return res.status(400).send("Bad request");
                let status = {};
                status[gameState] = results[0].game_state,
                status[players] = {
                    playerName: results[0].first_name,
                    playerID: results[0].id,
                    status: results[0].status,
                    chips: results[0].chips,
                    cards: ["2S", "AH"] //TODO: 
                }
                res.set("Content-Type", "application/json");
                res.json(status);
             })

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

            let q = 'SELECT * FROM Users u \
             JOIN Games_Players gp ON u.id = gp.player_id \
             JOIN Games g ON g.id = gp.game_id \
             WHERE u.id = ? AND g.ID = ? '
             connection.query(q, [userid, gameid], (err, results) => {
                if(err) return res.status(400).send("Bad request");
                let status = {};
                status[gameState] = results[0].game_state,
                status[players] = {
                    playerName: results[0].first_name,
                    playerID: results[0].id,
                    status: results[0].status,
                    chips: results[0].chips,
                    cards: ["2S", "AH"] //TODO: 
                }
                res.set("Content-Type", "application/json");
                res.json(status);
             })

        }
    })

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

        }
    })




  module.exports = app;