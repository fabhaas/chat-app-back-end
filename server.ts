import * as fs from "fs";
import * as http from "http";
import * as express from "express";
import * as socketio from "socket.io";
import { mountRoutes } from "./routes/routes";
import { initSockets } from "./sockets/sockets";

const app = express();
const server = new http.Server(app);
const io = socketio(server);
const config = JSON.parse(fs.readFileSync("./config.json").toString());

initSockets(io);

app.use(express.json()); //enable json bodies
app.use((req, res, next) => {
    //for enabling cors
    /*res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type");*/
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
    next();
});

mountRoutes(app);

server.listen(config.server.port, "localhost", function () {
    console.log(`Server now listening on ${config.server.port}`);
});