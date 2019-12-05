const express = require("express");
const mysql = require("mysql");
const sendToMQ = require('../queueMessage')
const app = express();

let connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_ROOT_PASSWORD,
    database : process.env.MYSQL_DATABASE
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
        if (req.body.members == null || undefined){
            list["ID" + user] = user;
        }else{
            for(let i in req.body.members){
               list["ID" + req.body.members[i]] = req.body.members[i];
            }
        }
        if(req.body.createdAt == null || undefined){
            createdAt = mySQLDate();
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
            let creator = parseInt(results[0].creator);
            if( user != creator){
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
                    res.set("Content-Type", "text/plain ");
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
            let creator = parseInt(results[0].creator);
            if( user != creator){
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
                    res.set("Content-Type", "text/plain ");
                    res.send("User deleted");
                });
            }
        }
    });

app.route('/v1/channels/:channelID')
    .get((req, res) =>{
        if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
        let user = JSON.parse(req.get('X-User')).id;
        let id = parseInt(req.params.channelID);
        let msgID = req.query.before;
        let values;
        let query;
        if (msgID == null || undefined){
            query = "SELECT * FROM Messages WHERE channelID=?";
            values = id;
        } else {
            query = "SELECT * FROM Messages WHERE channelID=? AND id < ? LIMIT 100";
            values = [id, msgID];
        };
        connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
            if(err) res.status(400).send("Bad request");;
            let prv = JSON.stringify(results[0].private);
            let members = JSON.parse(results[0].members)
            let valid = 0;
            for(let i in members){
                if(user == parseInt(members[i])){
                   valid = 1;
                };
            }
            if(prv && valid == 0){
                res.status(403).send("Forbidden");
            } else{
                connection.query(query, values, (err, results) =>{
                    if(err) {
                        res.status(400).send("Bad request");
                        return;
                    };
                    res.set("Content-Type", "application/json");
                    res.json(results);   
                });
            }
        });                   
    })
    .post((req, res) =>{
        if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
        let user = JSON.parse(req.get('X-User')).id;
        let id = parseInt(req.params.channelID);
        if (req.body.body == null || undefined) {
            res.status(400).send("Bad request: cannot post blank message");
            return;
        }
        connection.query("SELECT * FROM Channels WHERE id=?",id, (err, results)=>{
            if(err) {
                res.status(400).send("Bad request");
                return;
            };
            let prv = JSON.stringify(results[0].private);
            let members = JSON.parse(results[0].members);
            let valid = 0;
            for(let i in members){
                if(user == parseInt(members[i])){
                   valid = 1;
                };
            }
            if(prv && valid == 0){
                res.status(403).send("Forbidden");
            } else{
                insertMessage();
            }
        });
        
        function insertMessage(){
            let msg = { 
                channelID: req.params.channelID, 
                body: req.body.body,
                createdAt: mySQLDate(),
                creator: user,
                editedAt: null
            };
            connection.query("INSERT INTO Messages SET ?", msg, (err, results) => {
                if(err) {
                    res.status(400).send("Bad request");
                    return;
                };
                let id = results.insertId;
                analyzeResults(id);
            });
            function analyzeResults(id){
                connection.query('SELECT * FROM Messages WHERE id=?', id, (err, results) =>{
                    res.set("Content-Type", "application/json");
                    res.status(201).json(results[0]);
                    getChannelFromMessage(id);
                });
            }
        }
        
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
            let creator = parseInt(results[0].creator);
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
            let data = [name, desc, mySQLDate(), id];
            if (desc != null || undefined){
                connection.query('UPDATE Channels SET name = ?, description = ?, editedAt = ? WHERE id=?', data, (err, results) =>{
                    if(err) {
                        res.status(400).send("Bad request");
                        return;
                    };
                    connection.query('SELECT * FROM Channels WHERE id=?', id, function(err, row){
                        res.set("Content-Type", "application/json");
                        res.status(201).json(row[0]);
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
                        res.status(201).json(row[0]);
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
            let creator = parseInt(results[0].creator);
            if( user != creator){
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
                    res.set("Content-Type", "text/plain ");
                    res.send("Channel and messages deleted");
                    let members = JSON.parse(channel[0].members);
                    let userIds = [];
                    if (channel[0].private == 1) {
                        for (var key of Object.keys(members)) {
                            userIds.push(members[key]);
                        }
                    }
                    let data = {
                        type: 'channel-delete',
                        channel: channel[0],
                        userIDs: userIds
                    };
                    sendToMQ(req, data);
                })
            }
        }
    
    });


app.route('/v1/messages/:messageID')
    .patch((req, res) =>{
        if(req.get('X-User') == null || undefined) return res.status(401).send("Unauthorized");
        let user = JSON.parse(req.get('X-User')).id;
        let id = parseInt(req.params.messageID);
        let msg = req.body.body;
        if (msg == null || undefined) {
            res.status(400).send("Bad request: cannot update");
            return;
        }
        connection.query("SELECT * FROM Messages WHERE id=?",id, (err, results)=>{
            if(err) {
                res.status(400).send("Bad request: could not find message");
                return;
            };
            let creator = parseInt(results[0].creator);
            if( user != creator){
                res.status(403).send("Forbidden");
            } else{
                updateMessages()
            }
        });
        
        function updateMessages(){
            connection.query('UPDATE Messages SET body = ?, editedAt = ? WHERE id = ?', [msg, mySQLDate(), id], (err, results) =>{
                if(err) {
                    res.status(400).send("Bad request: could not update");
                    return;
                };
                getMessages();
            })
            function getMessages(){
                connection.query('SELECT * FROM Messages WHERE id =?', id, (err, results) =>{
                    res.set("Content-Type", "application/json");
                    res.json(results[0]);
                    getChannelFromMessage(id);
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
            let creator = parseInt(results[0].creator);
            if( user != creator){
                res.status(403).send("Forbidden");
            } else{
                deleteMessage()
            }
        });
        function deleteMessage(){
            connection.query('DELETE FROM Messages WHERE id=?', id, (err, results) =>{
                if(err) {
                    res.status(400).send("Bad request");
                    return;
                };
                res.set("Content-Type", "text/plain ");
                res.send("message deleted");
                getChannelFromMessage(msgID);

            });
        }
       });


function getChannelFromMessage(msgID) {
    connection.query('SELECT * FROM Messages WHERE id=?', msgID, (err, results) =>{
        if(err) {
            res.status(400).send("Bad request");
            return;
        };
        let channelID = results[0].channelID;
        sendToMsgQueue(channelID);

    });
}

function sendToMsgQueue(channelID) {
    connection.query('SELECT * FROM Channels WHERE id=?', channelID, (err, results) =>{
        
        let members = JSON.parse(results[0].members);
        let userIds = [];
        if (results[0].private == 1) {
            for (var key of Object.keys(members)) {
                userIds.push(members[key]);
            }
        }
        let data = {
            type: 'message-delete',
            messageID: id,
            userIDs: userIds
        };
        sendToMQ(req, data);
    });
}

function mySQLDate(date){
    date = date || new Date();
    return date.toISOString().split('T')[0];
}


module.exports = app