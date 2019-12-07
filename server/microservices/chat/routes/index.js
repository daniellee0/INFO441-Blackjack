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


  app.route('/v1/channels')
  .get((req, res) =>{
      if(!req.get('X-User')) {
          res.status(401).send("Unauthorized");	
          return;
      } 
      connection.query("SELECT * FROM Channels", (err, results) =>{
          if (err) throw err;
          let list = [];
          let user = JSON.parse(req.get('X-User')).id;
          for(let i in results){
              let members =  JSON.parse(results[i].members);
              for( let x in members){
                  if (user == members[x]){list.push(results[i].id);}
              }
          }
              analyzeResults(list);    
          }); 
          function analyzeResults(list){
              connection.query(`SELECT * FROM Channels WHERE id IN (${list})`, (err, results) =>{
                  res.setHeader("Content-Type", "application/json");
                  res.json(results); 
              })
          } 
  })
 
  .post((req, res) =>{
      if(!req.get('X-User')) {
          res.status(401).send("Unauthorized");	
          return;
      } 
      let user = JSON.parse(req.get('X-User')).id;
      let list = {};
      let creator = req.body.creator;
      if (creator != null && user != creator) {
          res.status(401).send("Unauthorized");	
          return;
      } else {
          creator = user
      }
      if (req.body.name == null || undefined) {
          res.status(400).send("Bad request");	
          return;
      }
      let createdAt = req.body.createdAt;
      let private;
      if (req.body.private == null || undefined) {
          private = true;
      } else {
          private = req.body.private
      }
      list["ID" + user] = user;
      if(req.body.createdAt == null || undefined){
          // createdAt = mySQLDate();
          createdAt = new Date().toISOString().slice(0, 23).replace('T', ' ');
      }
      const newChannel = {
          name: req.body.name,
          description: req.body.description,
          private: private,
          members: JSON.stringify(list),
          createdAt: createdAt,
          creator: creator,
          editedAt: req.body.editedAt
      };
      connection.query('INSERT INTO Channels SET ?',newChannel, (err, results) =>{
          if(err) {
              res.status(400).send("Bad request");
              return;
          };
          let id = results.insertId;
          getChannel(id);
      });
      function getChannel(id){
          connection.query('SELECT * FROM Channels WHERE id=?', id, (err, results) =>{
              res.set("Content-Type", "application/json");
              res.status(201).json(results[0]);
              let userIds = [];
              if (list != null) {
                  for (var key of Object.keys(list)) {
                      userIds.push(list[key]);
                  }
              } 
              let data = {
                  type: 'channel-new',
                  channel: results[0],
                  userIDs: userIds
              };
              sendToMQ(req, data);
          });
      };
  })
  .all((req, res) =>{
      res.set("Content-Type", "text/plain");
      res.status(405).send("Bad request");
      return;
  });

  
app.route('/v1/channels/:channelID/members')
  .post((req, res) =>{
      if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
      let newMemberID = req.body.id;
      let user = JSON.parse(req.get('X-User')).id;
      let id = parseInt(req.params.channelID);
      connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
          if(err) {
              res.status(400).send("Bad request");
              return;
          };
          let creator = results[0].creator;
          if( user != creator){
              res.set("Content-Type", "text/plain");
              res.status(403).send("Forbidden");
              return;
          } else{
              updateChannel()
          }
      }); 
      function updateChannel(){
          connection.query('SELECT * FROM Channels WHERE id=?', id, function (err, results){
              if(err) {
                  res.status(400).send("Bad request");
                  return;
              };
              analyzeResults(results[0])   
          });
          function analyzeResults(results){
              let members = JSON.parse(results.members);
              members["ID" + newMemberID] = newMemberID;
              let updatedMembers = JSON.stringify(members);
              connection.query('UPDATE Channels SET members = ? WHERE id = ?', [updatedMembers, results.id], (err, results) =>{
                  if(err) {
                      res.status(400).send("Bad request");
                      return;
                  };
                  res.set("Content-Type", "text/plain");
                  res.status(201).send("member added");
              })
          }
      }

  })
  .delete((req, res) =>{
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
              res.set("Content-Type", "text/plain");
              res.status(403).send("Forbidden");
          } else{
              deleteMember()
          }
      }); 
      function deleteMember(){
          connection.query('SELECT * FROM Channels WHERE id=?', id, function (err, results){
              if(err) {
                  res.status(400).send("Bad request");
                  return;
              };
              analyzeResults(results[0])
          });
          function analyzeResults(results){
              let members = JSON.parse(results.members);
              let rmUser = parseInt(req.body.id);
             
              for(let i in members){
                  if(rmUser == members[i]){
                      delete members[i];
                  }
              }
              let list = JSON.stringify(members);
              connection.query('UPDATE Channels SET members = ? WHERE id=?', [list, results.id], (err, results) =>{
                  if(err) {
                      res.status(400).send("Bad request");
                      return;
                  };
                  res.set("Content-Type", "text/plain");
                  res.status(201).send("User deleted");
              });
          }
      }
  })
  .all((req, res) =>{
      res.set("Content-Type", "text/plain");
      res.status(405).send("Bad request");
      return;
  });

app.route('/v1/games/:GameID')
//   .get((req, res) =>{
//       if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
//       let user = JSON.parse(req.get('X-User')).id;
//       let id = parseInt(req.params.GameID);
//       let msgID = req.query.before;
//       let values;
//       let query;
//       if (msgID == null || undefined){
//           query = "SELECT * FROM Messages WHERE channelID=?";
//           values = id;
//       } else {
//           query = "SELECT * FROM Messages WHERE channelID=? AND id < ? LIMIT 100";
//           values = [id, msgID];
//       };
//       connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
//           if(err) res.status(400).send("Bad request");;
//           let prv = results[0].private;
//           let members = JSON.parse(results[0].members)
//           let valid = 0;
//           for(let i in members){
//               if(user == parseInt(members[i])){
//                  valid = 1;
//               };
//           }
//           if(prv == 1 && valid == 0){
//               res.status(403).send("Forbidden");
//           } else{
//               connection.query(query, values, (err, results) =>{
//                   if(err) {
//                       res.status(400).send("Bad request");
//                       return;
//                   };
//                   res.set("Content-Type", "application/json");
//                   res.json(results);   
//               });
//           }
//       });                   
//   })
  .post((req, res) =>{
        if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
        let user = JSON.parse(req.get('X-User')).id;
        let id = parseInt(req.params.GameID);
        if (req.body.body == null || undefined) {
            res.status(400).send("Bad request: cannot post blank message");
            return;
        }
    //   connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
    //       if(err) {
    //           res.status(400).send("Bad request");
    //           return;
    //       };
    //       let prv = results[0].private;
    //       let members = JSON.parse(results[0].members);
    //       let valid = 0;
    //       for(let i in members){
    //           if(user == parseInt(members[i])){
    //              valid = 1;
    //           };
    //       }
    //       if(prv == 1 && valid == 0){
    //           res.set("Content-Type", "text/plain");
    //           res.status(403).send("Forbidden");
    //       } else{
    //           insertMessage();
    //       }
    //   });
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
        // connection.query("INSERT INTO Messages SET ?", msg, (err, results) => {
        //     if(err) {
        //         res.status(400).send("Bad request");
        //         return;
        //     };
        //     let id = results.insertId;
        //     addNewMessageResponse(id, res, req, username);
        // });

      
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

// function sendToMsgQueue(channelID, msgID, type, message, req) {
//   connection.query('SELECT * FROM Messsages WHERE game_id=?', channelID, (err, results) =>{
      
//       let members = JSON.parse(results[0].members);
//       let userIds = [];
//       if (results[0].private == 1) {
//           for (var key of Object.keys(members)) {
//               userIds.push(members[key]);
//           }
//       }
//       let data;
//       if (type == "delete") {
//           data = {
//               type: 'message-delete',
//               messageID: msgID,
//               userIDs: userIds
//           };
//       } else {
//           data = {
//               type: 'message-' + type,
//               message: message,
//               userIDs: userIds
//           };
//       }

//       sendToMQ(req, data);
//   });
// }

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