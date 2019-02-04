import * as fs from "fs";
import * as http from "http";
import * as express from "express";
import * as WebSocket from "ws";
import { mountRoutes } from "./routes/routes";
import { sockets } from "./sockets/sockets";
import * as cors from "cors";

const app = express();
const server = new http.Server(app);
const config = JSON.parse(fs.readFileSync("./config.json").toString());
const wss: WebSocket.Server = new WebSocket.Server({
    port: 3001,
    clientTracking: true
}, () => console.log(`WebSocket server listening on port ${wss.options.port}.`));

sockets.init(wss);

app.use(express.json()); //enable json bodies
app.use(cors());

mountRoutes(app);

server.listen(config.server.port, "localhost", function () {
    console.log(`Server now listening on ${config.server.port}`);
});