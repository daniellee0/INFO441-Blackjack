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
    let authid = JSON.parse(req.get('X-User')).id;
    let userid = req.params.userid;
    if( authid != userid){
        res.status(401).send("Unauthorized");
    }
   if (req.body.name == undefined  || req.body.name.length <= 1) {
        res.status(400).send("Bad request")
   } else{
        connection.query('UPDATE Users SET status = ? WHERE id = ?)', ["ready", userid], (err, results) =>{
            if(err)res.status(400).send("Bad request");
            res.status(201).send("Player registered")
        });
    }
    
  });

app.route('/v1/Users/:userid/unregister')
    .delete((req, res) =>{
        if(!req.get('X-User')) {
            res.status(401).send("Unauthorized");	
            return;
        } 
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.params.userid;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        }
        connection.query('DELETE FROM Users WHERE id = ?', userid, (err, results) =>{
            if(err)res.status(400).send("Bad request");
            res.status(201).send("Player Unregistered");
        });
});



// get player using gameid
// update bet amount
// respond with new player obj

function getPlayer(gid, uid){
    return new promise ((rejest, resolve) =>{
        let q = 'SELECT * FROM Users INNER JOIN Games_Players ON Users.id = Games_Players.player_id INNER JOIN Games ON Games_Players.game_id = Games.id WHERE Games.id = ? AND Users.id = ? '
        connection.query(q, [gid, uid], (err, results) =>{
            if(results === undefined){
                reject(err);
            }else{
                resolve(results[0]);
            }

        })

    });
}



app.route('/v1/Games/:gameid/Users/:userid/bet')
    .get((req, res) => {
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.params.userid;
        let gameid = req.params.gameid;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        }
        getPlayer(gameid, userid).then((value) => {
            res.setHeader("Content-Type", "application/json");
            res.status(201).json(value);
        }); 
    })
    .patch((req, res) =>{
        let authid = JSON.parse(req.get('X-User')).id;
        let userid = req.params.userid;
        let gameid = req.params.gameid;
        let betAmount = 0;
        if( authid != userid){
            res.status(401).send("Unauthorized");
        }
        getPlayer(gameid, userid).then((value) => {
            betAmount = value.chips - req.body.bet;
            let q = 'UPDATE USERS INNER JOIN Games_Players ON Users.id = Games_Players.player_id INNER JOIN Games ON Games_Players.game_id = Games.id WHERE Games.id = ? AND Users.id = ? SET Users.chips = ?'
            connection.query(q, [gameid, userid, betAmount], (err, results) =>{
                if(err) return res.status(401).send("Bad Request");
            });
        });
        getPlayer(gameid, userid).then((value) => {
            res.setHeader("Content-Type", "application/json");
            res.status(201).json(value);
        });       
})




  module.exports = app;