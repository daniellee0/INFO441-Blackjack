"use strict";
 const express = require("express");
 const morgan = require("morgan");
 const app = express();
 const addr = process.env.ADDR || ":80";
 const [host, port] = addr.split(":");
 const routes = require("./routes");
//  const amqp = require("amqplib");
//  const queueName = "queue";
//  const rabbitAddr = process.env.RABBITADDR;
//  const mqURL = `amqp://${rabbitAddr}`;



(async () => {
    try {
        // app.use(morgan('dev'));
        app.use(express.json());
        app.use(routes)
       
    //    let connection = await amqp.connect(mqURL);
    //    let msgqChannel = await connection.createChannel();
       
    //    let queueConf = await msgqChannel.assertQueue(queueName, { durable: true });
    //    app.set('msgqChannel', msgqChannel);
    //    app.set('queueName', queueName);
       
       
       
       app.listen(port, host, () => {
           //callback is executed once server is listening
           console.log(`server is listening at http://${addr}...`);
       });
    } catch (err) {
        console.log(err);
    }
})();