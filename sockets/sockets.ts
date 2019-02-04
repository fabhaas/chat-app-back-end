import * as WebSocket from "ws";
import { SocketEmitter } from "./emitter";
import * as errHandler from "../errHandler";
import { authenticate } from "./authenticate";
import { usermessage } from "./usermessage";
import { User } from "../database/types/user";
import { groupmessage } from "./groupmessage";
import { users } from "../database/database";

let wss: WebSocket.Server;

export class Sockets {
    async refreshAll() {
        const clients = wss.clients.values();
        for (const client of clients) {
            this.emitEvent(client, "refreshall");
            (<any>client).user = await users.get((<any>client).user);
        }
    }

    async refreshGroup(groupid: number, type: string) {
        const clients = wss.clients.values();

        if (type === "created") {
            //refresh all
            for (let client of clients)
                if ((<any>client).user)
                    (<any>client).user.groups = await users.getGroups((<any>client).user);

            //send new members message
            for (let client of clients)
                if ((<any>client).user)
                    for (const group of (<any>client).user.groups)
                        if (group[0] == groupid)
                            this.emitEvent(client, "refreshgroups", type, groupid);
        } else {
            //find members and send message
            for (const client of clients)
                if ((<any>client).user)
                    for (const group of (<any>client).user.groups)
                        if (group[0] == groupid) {
                            this.emitEvent(client, "refreshgroups", type, groupid);
                            (<any>client).user.groups = await users.getGroups((<any>client).user);
                        }
        }
    }

    async refreshFriend(user0: string, user1: string, type: string) {
        const clients = wss.clients.values();
        for (const client of clients)
            if ((<any>client).user)
                if ((<any>client).user.name === user0 || (<any>client).user.name === user1) {
                    this.emitEvent(client, "refreshfriends", type, user0, user1);
                    (<any>client).user.friends = await users.getFriends((<any>client).user);
                }
    }

    emitEvent(socket: WebSocket, event: string, ...data: any[]) {
        socket.send(JSON.stringify({
            event: event,
            data: data
        }), err => errHandler.wsErr(err));
    }

    sendMsgToUser(user: User, to: string, msg: string, timestamp: Date) {
        const clients = wss.clients.values();
        for (const client of clients) {
            if ((<any>client).user)
                if ((<any>client).user.name === to)
                    this.emitEvent(client, "usermessage", user.name, to, msg, timestamp);
        }
    }

    sendMsgToGroup(from: User, to: number, msg: string, timestamp: Date) {
        const clients = wss.clients.values();
        for (const client of clients)
            for (const group of (<any>client).user.groups)
                if (group[0] === to)
                    this.emitEvent(client, "groupmessage", from.name, to, msg, timestamp);
    }

    sendError(socket: WebSocket, msg: string, code: number) {
        socket.send(JSON.stringify({
            event: "error",
            data: [msg, code]
        }), err => errHandler.wsErr(err));
    }

    init(server: WebSocket.Server) {
        wss = server;
        wss.on("error", err => errHandler.wsErr(err));
        wss.on("connection", (socket, req) => {
            (<any>socket).user = null;

            const events = ["auth", "usermessage", "groupmessage"];
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

                    if (msg.event === 'auth') {
                        if (typeof msg.data[0] === "string" && typeof msg.data[1] === "string") {
                            authenticate(socket, msg.data[0], msg.data[1])
                                .then(user => (<any>socket).user = user);
                        }
                        return;
                    }

                    if ((<any>socket).user)
                        if (events.includes(msg.event))
                            emitter.emit(msg.event, (<any>socket).user, ...msg.data);
                        else
                            throw "wrong event";
                    else
                        throw "not authenticated";
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
}

export const sockets = new Sockets();