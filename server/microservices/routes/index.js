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


function validate(req, res){

    return ( req.body.name == undefined  && (req.body.name.length <= 1 || name == null))
        // res.status(400).send("Bad Request");
    

}

app.route('/v1/Users/register')
  .post((req, res) =>{
    
   validate(req, res);

    const user = {
        name : req.body.name,
        status: req.body.status,
        chips: req.body.chips,
        cards: req.body.cards.toString()
    }

    connection.query('INSERT INTO Users SET ?', user, (e, results) =>{
       res.status(201).send("Player registered")
    });
    
  });

app.route('/v1/Users/:playerName/unregister')
    .delete((req, res) =>{
        let name = req.params.playerName;
        connection.query('DELETE FROM Users WHERE name = ?', name, (e, r) =>{
            if(e)res.status(400).send("Bad request");
            res.status(201).send("Player Unregistered");
        });
});




  module.exports = app