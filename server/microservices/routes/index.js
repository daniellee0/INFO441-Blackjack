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
  .post((req, res) =>{
    
   if (req.body.name == undefined  || req.body.name.length <= 1) {
        res.status(400).send("Bad request")
   } else{
        const user = {
            name : req.body.name,
            status: req.body.status,
            chips: req.body.chips,
            cards: req.body.cards.toString()
        }

        connection.query('INSERT INTO Users SET ?', user, (err, results) =>{
            res.status(201).send("Player registered")
        });
    }
    
  });

app.route('/v1/Users/:playerName/unregister')
    .delete((req, res) =>{
        let name = req.params.playerName;
        connection.query('DELETE FROM Users WHERE name = ?', name, (err, results) =>{
            if(err)res.status(400).send("Bad request");
            res.status(201).send("Player Unregistered");
        });
});

function getPlayer(name){
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM Users WHERE name = ?', name, (err, results) =>{
            console.log(results)
            if(results === undefined){
                reject(new Error("Error row is undefined"));
            }else{
                resolve(results[0]);
            }
        })
    })
}

function updatePlayer(name, amount){
    return new Promise((resolve, reject) =>{
        connection.query('UPDATE Users SET chips = ? WHERE name = ?', [amount, name], (err, results) =>{
            if(err != null){
                reject(new Error("Error row is undefined"));
            }else{
                resolve(results[0]);
            }
        })
    })
}
app.route('/v1/Users/:playerName/:bet')
    // .patch((req, res) =>{
    //     let name = req.params.playerName;
    //     // let amount = req.params.bet;
    //     getPlayer(name).then ((value) =>{
    //             if(value == undefined){
    //                 res.status(400).send("Bad request");
    //             } else {
    //                 console.log(value);
    //                 let amount = value.chips - req.params.bet;
    //                 updatePlayer(name, amount).then(() =>{
    //                     console.log("updated")
    //                 })

    //             }
                
    //         })
        
        
    // })




  module.exports = app