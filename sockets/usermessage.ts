import { User } from "../database/types/user";
import * as WebSocket from "ws";
import { sendMsgToUser, sendError } from "./sockets";
import { messages } from "../database/database";
import * as errHandler from "../errHandler";

export async function usermessage(socket: WebSocket, user: User, to: string, msg: string) {
    try {
        if (typeof to !== "string" || typeof msg !== "string") {
            sendError(socket, "wrong arguments", 4);
            return;
        }
        if (user.friends.includes([to, true])) {
            sendMsgToUser(user, to, msg);
            await messages.addUserMsg(user, to, msg);
        } else {
            sendError(socket, "not a friend of user", 2);
        }
    } catch (err) {
        errHandler.wsErr(err);
    }
}