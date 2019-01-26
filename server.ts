import * as fs from "fs";
import * as http from "http";
import * as express from "express";
//import * as socketio from "socket.io";
import * as WebSocket from "ws";
import { mountRoutes } from "./routes/routes";
import { initSockets } from "./sockets/sockets";

const app = express();
const server = new http.Server(app);
const config = JSON.parse(fs.readFileSync("./config.json").toString());
const wss: WebSocket.Server = new WebSocket.Server({
    port: 3001,
    clientTracking: true
}, () => console.log(`WebSocket server listening on port ${wss.options.port}.`));

initSockets(wss);
app.get("/", (req, res) => { res.sendFile("/home/fahaas/Uni/Webtechnologien/PR/back-end/test/index.html"); });
app.use(express.json()); //enable json bodies
app.use((req, res, next) => {
    //for enabling cors
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
    next();
});

mountRoutes(app);

server.listen(config.server.port, "localhost", function () {
    console.log(`Server now listening on ${config.server.port}`);
});