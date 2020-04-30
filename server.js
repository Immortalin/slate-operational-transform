const defaultValue = require('./defaultValue')
const WebSocket = require('ws')
const WebSocketJSONStream = require('@teamwork/websocket-json-stream')
const ShareDB = require('sharedb')
const share = new ShareDB()
const connection = share.connect()
const doc = connection.get("my_documents", "hello_world")

function noop() { }

function heartbeat() {
    this.isAlive = true;
}

doc.create(defaultValue, () => {

    const port = 9080
    console.log("Server starting on port:", port)
    const wss = new WebSocket.Server({ port: port });
    const user_map = new Map()

    wss.on('connection', function connection(ws, req) {
        //   ws.on('message', function incoming(message) {
        //     console.log('received: %s', message);
        //   });
        ws.isAlive = true;
        ws.on('pong', heartbeat);

        //   ws.send('something');
        const user_key = req.headers['sec-websocket-key']
        const json_stream = new WebSocketJSONStream(ws)
        // Monotonic increasing user id
        const user_id = Math.max(...Object.keys(doc.data.users)) + 1
        user_map.set(user_key, user_id)
        console.log("New user " + user_id + " joined!")
        console.log("Total users:")
        console.log(user_map)

        doc.submitOp([{ p: ['users', user_id], oi: {} }], () => {
            share.listen(json_stream)
        })

        const delete_user = () => {
            console.log("Users before deletion:")
            console.log(doc.data.users)
            const user_id = user_map.get(user_key)
            doc.submitOp([{ p: ['users', user_id], od: doc.data.users[user_id] }], () => {
                console.log("Users after deletion:")
                console.log(doc.data.users)
            })
            user_map.delete(user_key)
        }

        // https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
        const interval = setInterval(function ping() {
            wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    delete_user()
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping(noop);
            });
        }, 30000);

        ws.on('close', () => {
            delete_user()
            clearInterval(interval)
        })

    })

})