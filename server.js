const WebSocket = require('ws');
const port = 9080
console.log("Server starting on port:", port)
const wss = new WebSocket.Server({ port: port });
// import {Editor} from "slate"
const slate = require("slate")
const Editor = slate.Editor

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

let currentServerValue = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable and pulled directly from server' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>', code: true },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text:
          ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Try it out for yourself!' }, { text: 'bold', bold: true },
    {
      text:
        'Operation transforms will let things to magically converge into the same state.',
    },],
  },
]

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
