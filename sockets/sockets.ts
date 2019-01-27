import * as WebSocket from "ws";
import { SocketEmitter } from "./emitter";
import * as errHandler from "../errHandler";
import { authenticate } from "./authenticate";
import { usermessage } from "./usermessage";
import { User } from "../database/types/user";
import { groupmessage } from "./groupmessage";

let wss: WebSocket.Server;

export function emitEvent(socket: WebSocket, event: string, ...data: any[]) {
    socket.send(JSON.stringify({
        event: event,
        data: data
    }), err => errHandler.wsErr(err));
}

export function sendMsgToUser(user: User, to: string, msg: string) {
    const clients = wss.clients.values();
    for (const client of clients)
        if ((<any>client).user)
            if ((<any>client).user.name === to)
                emitEvent(client, "usermessage", user.name, msg);
}

export function sendMsgToGroup(from: User, to: number, msg: string) {
    const clients = wss.clients.values();
    for (const client of clients)
        for (const group of (<any>client).user.groups)
            if (group[0] === to)
                emitEvent(client, "groupmessage", to, from.name, msg);
}

export function sendError(socket: WebSocket, msg: string, code: number) {
    socket.send(JSON.stringify({
        event: "error",
        data: [ msg, code ]
    }), err => errHandler.wsErr(err));
}

export function initSockets(server: WebSocket.Server) {
    wss = server;
    wss.on("error", err => errHandler.wsErr(err));
    wss.on("connection", (socket, req) => {
        (<any>socket).user = null;
        
        const events = [ "auth", "usermessage", "groupmessage" ];
        const emitter = new SocketEmitter();
        emitter.addListener("usermessage", (user: User, to: string, msg: string) => usermessage(socket, user, to, msg));
        emitter.addListener("groupmessage", (user: User, to: number, msg: string) => groupmessage(socket, user, to, msg));

        socket.on("message", data => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.event && msg.data) {
                    if (typeof msg.event !== "string" || !Array.isArray(msg.data))
                        throw "wrong data: wrong types";
                } else {
                    throw "wrong data: not parsable";
                }

                if ((<any>socket).user)
                    if (events.includes(msg.event))
                        emitter.emit(msg.event, (<any>socket).user, ...msg.data);
                    else
                        throw "wrong event";
                else {
                    if (msg.event === "auth") {
                        if (typeof msg.data[0] === "string" && typeof msg.data[1] === "string") {
                            authenticate(socket, msg.data[0], msg.data[1])
                                .then(user => (<any>socket).user = user);
                        }
                    } else {
                        throw "not authenticated";
                    }
                }
            } catch (err) {
                errHandler.wsErr(new Error(`error while processing received message: ${err}`));
                socket.close(4000, "Unauthorized");
            }
        });
        socket.on("close", (code, reason) => {
            if (code || reason)
                console.log(`${(<any>socket).user ? "User " + (<any>socket).user.name : "Unknown user"} disconnected. REASON: ${reason}. CODE: ${code}`);
        });
        socket.on("error", err => {
            errHandler.wsErr(err);
        });
    });
}