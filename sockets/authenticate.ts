import { emitEvent, sendError } from "./sockets";
import { users } from "../database/database";
import * as WebSocket from "ws";
import * as errHandler from "../errHandler"

export async function authenticate(socket: WebSocket, name: string, token: string) {
    try {
        const user = await users.authenticate(name, token);
        if (!user) {
            sendError(socket, "authentication error", 1);
            return null;
        }
        await users.get(user);
        emitEvent(socket, "auth_success");
        return user;
    } catch (err) {
        errHandler.wsErr(err);
        sendError(socket, "authentication error", 1);
        return null;
    }
};