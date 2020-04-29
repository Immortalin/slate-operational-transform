const defaultValue = require('../../src/shared/defaultValue')
const WebSocket = require('ws')
const WebSocketJSONStream = require('@teamwork/websocket-json-stream')

const Backend = require('sharedb')
const json1 = require('ot-json1')
Backend.types.register(json1.type)
const backend = new Backend()
const connection = backend.connect()
const doc = connection.get('my_documents', 'hello_world')

doc.create(defaultValue, json1.type.name, () => {
  const port = 9080
  console.log('Server starting on port:', port)
  const wss = new WebSocket.Server({ port: port })

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message)
    })

    //   ws.send('something');
    const json_stream = new WebSocketJSONStream(ws)

    // json_stream.on('data', data => console.log('json_stream data', data))

    backend.listen(json_stream)
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
