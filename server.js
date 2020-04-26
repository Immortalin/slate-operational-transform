const WebSocket = require('ws');
const port = 9080 
console.log("Server starting on port:", port)
const wss = new WebSocket.Server({ port: port });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    console.log(data)
    console.log("\n")
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
