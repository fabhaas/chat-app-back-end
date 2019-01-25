//import * as errHandler from "../errHandler";
import { users } from "../database/database";
import { User } from "../database/types/user";
import * as socketio from "socket.io";
import { HashMap } from "hashmap";

const currUsers = new HashMap<string, User>();

export function initSockets(io: socketio.Server) {
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

            const user = await users.authenticate(name, token);
            if (!user) {
                userErr("failed to authenticate", socket);
                socket.disconnect(true);
                return;
            }

            await users.get(user);

            currUsers.set(socket.id, user);
        });

        socket.on("disconnect", () => {
            if (currUsers.has(socket.id))
                currUsers.remove(socket.id);
        });
    });
}

/*const currUsers = new HashMap<number, User>();
var maxID = 0;

export function initSockets(wss: Websocket.Server) {
    wss.on("error", err => errHandler.wsErr(err));

    wss.on("connection", (ws, req) => {
        const id = maxID++;
        const userErr = (reason: string) => {
            console.error(`User ${ws.url} ${reason}.`);
        }
        const checkAuth = (ws: Websocket) => {
            if (!currUsers.get(maxID)) {
                userErr("tried to send a message without autheticating himself/herself");
                return false;
            } else {
                return true;
            }
        }
        ws.on("message", async (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (!msg.type || !msg.data) {
                    userErr("sent inappropriate message");
                    return;
                }

                switch (msg.type) {
                    case "auth": {
                        const user = await chat.autheticate(msg.data.name, msg.data.token);
                        if (!user) {
                            userErr("authentication error");
                            break;
                        }
                        for (let val of await chat.getFriends(user))
                            user.friends.push(val[0]);
                        user.groups = await chat.getGroups(user);
                        currUsers.set(id, user);
                        ws.send(JSON.stringify({
                            type: "authCb",
                            data: true
                        }));
                        break;
                    }

                    case "refresh": {
                        if (!checkAuth(ws))
                            break;

                        const user = currUsers.get(id);
                        for (let val of await chat.getFriends(user))
                            user.friends.push(val[0]);
                        user.groups = await chat.getGroups(user);                        
                        break;
                    }

                    case "sendUserMsg": {
                        if (!checkAuth(ws))
                            break;

                        if (!msg.to) {
                            userErr("tried to send message to user without defining the user");
                            break;
                        }

                        const user = currUsers.get(id);
                        //TODO: when not online save to database
                        //TODO: save to database
                        if (user.friends.includes(msg.to))
                            ws.send(JSON.stringify({
                                type: "messageFromUser",
                                from: user.name,
                                data: msg.data
                            }), err => {
                                if (err)
                                    errHandler.wsErr(err);
                            });
                        else
                            userErr("is not in a friendship with the user which he/she is trying to send a message");
                        break;
                        }

                    case "sendGroupMsg": {
                        if (!checkAuth(ws))
                            break;

                        if (!msg.to) {
                            userErr("tried to send message to group without defining the group");
                            break;
                        }

                        const user = currUsers.get(id);

                        if (user.groups.includes(msg.to)) {
                            wss.clients.forEach((client) => {
                                if ((client as any).user.groups.includes(msg.to))
                                    ws.send({
                                        type: "messageFromGroup",
                                        from: (ws as any).user.name,
                                        group: msg.to,
                                        data: msg.data
                                    }, err => {
                                        if (err)
                                            errHandler.wsErr(err);
                                    });
                            });
                        } else {
                            userErr("is not part of the group which he/she tries to send a message to");
                        }
                        break;
                    }

                    default:
                        userErr("sent unknown event");
                        break;
                }
            } catch (err) {
                errHandler.wsErr(err);
            }
        });
        ws.on("error", err => errHandler.wsErr(err));
    });
}*/