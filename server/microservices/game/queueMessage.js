module.exports = function sendToMQ(req, data) {
    const msgqChannel = req.app.get('msgqChannel');
    const queueName = req.app.get('queueName');
    msgqChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
};