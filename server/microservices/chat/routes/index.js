const express = require("express");
const mysql = require("mysql");
const sendToMQ = require('../queueMessage');
const app = express();

let connection = mysql.createConnection({
    host     : "blackjackmysql",
    user     : "root",
    password : "password",
    database : "blackjackmysqldb"
  });


  
  


app.route('/v1/games/:GameID')

  .post((req, res) =>{
        if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
        let user = JSON.parse(req.get('X-User')).id;
        let id = parseInt(req.params.GameID);
        if (req.body.body == null || undefined) {
            res.status(400).send("Bad request: cannot post blank message");
            return;
        }
    
        let msg = { 
            player_id: user, 
            body: req.body.body,
            game_id: id
        };
        connection.query("SELECT * FROM Users WHERE id=?", user, (err, results) => {
            if(err) {
                res.status(400).send("Bad request");
                return;
            };
            let username = results[0].username;
            insertMessage(msg, res, req, username);
        });
      
  })
  .patch((req, res) =>{
      if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
      let user = JSON.parse(req.get('X-User')).id;
      let id = parseInt(req.params.channelID);
      connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
          if(err) {
              res.status(400).send("Bad request");
              return;
          };
          let creator = results[0].creator;
          if( user != creator){
              res.status(403).send("Forbidden");
          } else{
              updateChannel()
          }
      });
      
      function updateChannel(){
          let id = req.params.channelID;
          let name = req.body.name;
          if (name == null || undefined) {
              res.status(400).send("Bad request: name must be specified");
          }
          let desc = req.body.description;
          let data = [name, desc, new Date().toISOString().slice(0, 23).replace('T', ' '), id];
          if (desc != null || undefined){
              connection.query('UPDATE Channels SET name = ?, description = ?, editedAt = ? WHERE id=?', data, (err, results) =>{
                  if(err) {
                      res.status(400).send("Bad request");
                      return;
                  };
                  connection.query('SELECT * FROM Channels WHERE id=?', id, function(err, row){
                      res.set("Content-Type", "application/json");
                      res.status(200).json(row[0]);
                  });
              })
          } else {
              data = [name, id];
              connection.query('UPDATE Channels SET name = ?  WHERE id=?', data, (err, results) =>{
                  if(err) {
                      res.status(400).send("Bad request");
                      return;
                  };
                  connection.query('SELECT * FROM Channels WHERE id=?', id, function(err, row){
                      res.set("Content-Type", "application/json");
                      res.status(200).json(row[0]);
                      let members = JSON.parse(row[0].members);
                      let userIds = [];
                      if (row[0].private == 1) {
                          for (var key of Object.keys(members)) {
                              userIds.push(members[key]);
                          }
                      }
                      let data = {
                          type: 'channel-update',
                          channel: row[0],
                          userIDs: userIds
                      };
                      sendToMQ(req, data);
                  });
              })
          }
      }
  })
  .delete((req, res) =>{
      if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
      let user = JSON.parse(req.get('X-User')).id;
      let id = parseInt(req.params.channelID);
      if (id == 1) {
          res.status(400).send("Bad request: General cannot be deleted");
          return;
      }
      connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
          if(err) {
              res.status(400).send("Bad request");
              return;
          };
          let creator = results[0].creator;
          if( user != creator){
              res.set("Content-Type", "text/plain");
              res.status(403).send("Forbidden");
          } else{
              deleteAll(results[0])
          }
      });
      
      function deleteAll(channel){
          connection.query('DELETE FROM Channels WHERE id =?', id, (err, results) =>{
              if(err) {
                  res.status(400).send("Bad request");
                  return;
              };
              deleteMessages(channel);
          });
          function deleteMessages(channel){
              connection.query('DELETE FROM Messages WHERE channelID = ?', id, (err, results) =>{
                  if(err) {
                      res.status(400).send("Bad request");
                      return;
                  };
                  res.set("Content-Type", "text/plain");
                  res.send("Channel and messages deleted");
                  let members = JSON.parse(channel.members);
                  let userIds = [];
                  if (channel.private == 1) {
                      for (var key of Object.keys(members)) {
                          userIds.push(members[key]);
                      }
                  }
                  let data = {
                      type: 'channel-delete',
                      channelID: channel.id,
                      userIDs: userIds
                  };
                  sendToMQ(req, data);
              })
          }
      }
  
  })
  .all((req, res) =>{
      res.set("Content-Type", "text/plain");
      res.status(405).send("Bad request");
      return;
  });


app.route('/v1/messages/:messageID')
  .patch((req, res) =>{
      if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
      let user = JSON.parse(req.get('X-User')).id;
      let id = parseInt(req.params.messageID);
      let msg = req.body.body;
      if (msg == null || undefined) {
          res.set("Content-Type", "text/plain");
          res.status(403).send("Bad request: cannot update");
          return;
      }
      connection.query("SELECT * FROM Messages WHERE id=?",id, (err, results)=>{
          if(err) {
              res.set("Content-Type", "text/plain");
              res.status(403).send("Bad request: could not find message");
              return;
          };
          let creator = results[0].creator;
          if (user != creator) {
              res.set("Content-Type", "text/plain");
              res.status(403).send("Forbidden");
          } else {
              updateMessages()
          }
      });
      
      function updateMessages(){
          connection.query('UPDATE Messages SET body = ?, editedAt = ? WHERE id = ?', [msg, new Date().toISOString().slice(0, 23).replace('T', ' '), id], (err, results) =>{
              if(err) {
                  res.set("Content-Type", "text/plain");
                  res.status(400).send("Bad request: could not update");
                  return;
              };
              getMessages();
          })
          function getMessages(){
              connection.query('SELECT * FROM Messages WHERE id =?', id, (err, results) =>{
                  res.set("Content-Type", "application/json");
                  res.json(results[0]);
                  getChannelFromMessage(id, "update", results[0], req);
              });
          }
      }
    

  })
  .delete((req, res) =>{
      if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
      let user = JSON.parse(req.get('X-User')).id;
      let id = parseInt(req.params.messageID);
      connection.query("SELECT * FROM Messages WHERE id=?",id, (err, results)=>{
          if(err) {
              res.status(400).send("Bad request");
              return;
          };
          let creator = results[0].creator;
          if( user != creator){
              res.set("Content-Type", "text/plain");
              res.status(403).send("Forbidden");
          } else{
              deleteMessage(results[0])
          }
      });
      function deleteMessage(message){
          connection.query('DELETE FROM Messages WHERE id=?', id, (err, results) =>{
              if(err) {
                  res.status(400).send("Bad request");
                  return;
              };
              res.set("Content-Type", "text/plain");
              res.send("message deleted");
              getChannelFromMessage(id, "delete", message, req);

          });
      }
  })
  .all((req, res) =>{
      res.set("Content-Type", "text/plain");
      res.status(405).send("Bad request");
      return;
  });


function messagePlayers(type, message, req, username) {
    connection.query('SELECT * FROM Games_Players WHERE game_id=?', message.game_id, (err, results) =>{
        if(err) {
            res.status(400).send("Bad request");
            return;
        };
        let userIds = [];
        for (var i = 0; i < results.length; i++) {
            userIds.push(results[i].player_id);
        }
        data = {
            username: username,
            type: 'message-' + type,
            message: message,
            userIDs: userIds
        };
        console.log("workeing");
        sendToMQ(req, data);
    });
}



function addNewMessageResponse(id, res, req, username){
    connection.query('SELECT * FROM Messages WHERE id=?', id, (err, results) =>{
        res.set("Content-Type", "application/json");
        res.status(201).json(results[0]);
        messagePlayers("new", results[0], req, username);
    });
}

function insertMessage(msg, res, req, username) {
    connection.query("INSERT INTO Messages SET ?", msg, (err, results) => {
        if(err) {
            res.status(400).send("Bad request");
            return;
        };
        let id = results.insertId;
        addNewMessageResponse(id, res, req, username);
    });
}

module.exports = app