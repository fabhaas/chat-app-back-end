import * as WebSocket from "ws";
import { SocketEmitter } from "./emitter";
import * as errHandler from "../errHandler";
import { authenticate } from "./authenticate";
import { usermessage } from "./usermessage";
import { User } from "../database/types/user";

let wss: WebSocket.Server;

export function emitEvent(socket: WebSocket, event: string, ...data: any[]) {
    socket.send(JSON.stringify({
        event: event,
        data: data
    }), err => errHandler.wsErr(err));
}

export function sendMsgToUser(socket: WebSocket, user: User, to: string, msg: string) {
    const clients = wss.clients.values();
    for (const client of clients)
        if ((<any>client).user)
            if ((<any>client).user.name === to)
                emitEvent(client, "usermessage", user.name, msg);
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
        
        const events = [ "auth", "usermessage" ];
        const emitter = new SocketEmitter();
        emitter.addListener("usermessage", (user: User, to: string, msg: string) => { 
            usermessage(socket, user, to, msg);
        });

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
                                .catch(err =>  { throw err; });
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

//import * as errHandler from "../errHandler";
//import * as socketio from "socket.io";
//import { users, messages } from "../database/database";
//import { User } from "../database/types/user";
//import { HashMap } from "hashmap";
//import { Group } from "../database/types/group";

//const userData = new HashMap<string, User>();
//const currUsers = new HashMap<string, string>();

/*export function initSockets(io: socketio.Server) {
    const userErr = (reason: string, socket: socketio.Socket) => {
        console.error(`User ${socket.id} ${reason}.`);
    };

    io.on("connection", (socket: socketio.Socket) => {
        socket.on("auth", async (name: any, token: any) => {
            if (typeof name !== "string" || typeof token !== "string") {
                userErr("failed to authenticate", socket);
                socket.disconnect(true);
                return;
            }

            try {
                const user = await users.authenticate(name, token);
                if (!user) {
                    userErr("failed to authenticate", socket);
                    socket.disconnect(true);
                    return;
                }

                await users.get(user);

                userData.set(socket.id, user);
                currUsers.set(name, socket.id);

                socket.emit("auth_success");
            } catch (err) {
                userErr(err, socket);
                socket.disconnect(true);
            }
        });

        socket.on("user_message", async (msg: any, to: any) => {
            if (!userData.has(socket.id)) {
                userErr("authentication error", socket);
                socket.disconnect(true);
                return;
            }

            if (typeof msg !== "string" || typeof to !== "string") {
                userErr("failed to transmit message", socket);
                return;
            }

            try {
                const user = userData.get(socket.id);
                if (user.friends.includes(to)) {
                    if (currUsers.has(to))
                        socket.broadcast.to(currUsers.get(to)).emit("user_message", msg, user.name);
                    await messages.add(user, to, msg);
                } else {
                    userErr("failed to transmit message because the requesting user is not a friend of the receiver", socket);
                    return;
                }
            } catch (err) {
                userErr(err, socket);
                socket.disconnect(true);
            }
        });

        socket.on("group_message", async (msg: any, groupid: any) => {
            if (!userData.has(socket.id)) {
                userErr("authentication error", socket);
                socket.disconnect(true);
                return;
            }

            if (typeof msg !== "string" || typeof groupid !== "number") {
                userErr("failed to transmit message", socket);
                return;
            }

            try {
                const user = userData.get(socket.id);
                let group: Group;

                for (const g of user.groups) {
                    if (g.id === groupid) {
                        group = g;
                        return;
                    }
                }

                if (!group) {
                    userErr("failed to transmit message because user is not part of the group", socket);
                    return;
                }

                //get members
                //send to all members
            } catch (err) {
                userErr(err, socket);
                socket.disconnect(true);
            }
        });

        socket.on("disconnect", () => {
            if (currUsers.has(socket.id))
                currUsers.remove(socket.id);
        });
    });
}*/