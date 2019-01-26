import { emitEvent } from "./sockets";
import { users } from "../database/database";
import * as WebSocket from "ws";

export async function authenticate(socket: WebSocket, name: string, token: string) {
    const user = await users.authenticate(name, token);
    if (!user)
        throw "authetnication error";
    await users.get(user);
    (<any>socket).user = user;
    emitEvent(socket, "auth_success");
};