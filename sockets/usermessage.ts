import { User } from "../database/types/user";
import * as WebSocket from "ws";
import { sendMsgToUser, sendError } from "./sockets";
import { messages } from "../database/database";
import * as errHandler from "../errHandler";

export async function usermessage(socket: WebSocket, user: User, to: string, msg: string) {
    try {
        if (user.friends.includes(to)) {
            sendMsgToUser(socket, user, to, msg);
            await messages.add(user, to, msg);
        } else {
            sendError(socket, "not a friend of user", 1);
        }
    } catch (err) {
        errHandler.wsErr(err);
    }
}