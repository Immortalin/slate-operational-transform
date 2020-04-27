const defaultValue = require('./defaultValue')
const WebSocket = require('ws')
const WebSocketJSONStream = require('@teamwork/websocket-json-stream')
const ShareDB = require('sharedb')
const share = new ShareDB()
const connection = share.connect()
const doc = connection.get("my_documents", "hello_world")

doc.create(defaultValue, () => {

    const port = 9080
    console.log("Server starting on port:", port)
    const wss = new WebSocket.Server({ port: port });

    wss.on('connection', function connection(ws) {
        //   ws.on('message', function incoming(message) {
        //     console.log('received: %s', message);
        //   });

        //   ws.send('something');
        const json_stream = new WebSocketJSONStream(ws)
        share.listen(json_stream)
    })

})


// const port = 9080
// console.log("Server starting on port:", port)
// const wss = new WebSocket.Server({ port: port });

// wss.on('connection', function connection(ws) {
//     //   ws.on('message', function incoming(message) {
//     //     console.log('received: %s', message);
//     //   });

//     //   ws.send('something');
//     const json_stream = new WebSocketJSONStream(ws)
//     share.listen(json_stream)
// })