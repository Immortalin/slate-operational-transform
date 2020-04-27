const WebSocket = require('ws');
const port = 9080
console.log("Server starting on port:", port)
const wss = new WebSocket.Server({ port: port });
// import {Editor} from "slate"
const defaultValue = require("./defaultValue")
const slate = require("slate")
const Editor = slate.Editor

let currentServerValue = defaultValue

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    if (!Array.isArray(array) || !array.length) {
      // array does not exist, is not an array, or is empty
      // ⇒ do not attempt to process array
      return
    }
    console.log(data)
    console.log("\n")
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

// const withTest = editor => {
//   const { isInline, isVoid } = editor

//   editor.isInline = element => {
//     return element.inline === true ? true : isInline(element)
//   }

//   editor.isVoid = element => {
//     return element.void === true ? true : isVoid(element)
//   }

//   return editor
// }
