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

 


app.route("/v1/Users/register")
  .post((req, res) =>{
    
    if( req.body.name == null || req.body.name.length < 1){
        res.status(400).send("Bad Request")
    }

    const user = {
        name : req.body.name,
        status: req.body.status,
        chips: req.body.chips,
        cards: req.body.cards.toString()
  
    }

    connection.query('INSERT INTO Users SET ?', user, (e, results) =>{
       res.status(201).send("Player registered")
    })
    
  })




  module.exports = app