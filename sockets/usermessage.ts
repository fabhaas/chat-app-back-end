import { User } from "../database/types/user";
import * as WebSocket from "ws";
import { sockets } from "./sockets";
import { messages } from "../database/database";
import * as errHandler from "../errHandler";

export async function usermessage(socket: WebSocket, user: User, to: string, msg: string) {
    try {
        if (typeof to !== "string" || typeof msg !== "string") {
            sockets.sendError(socket, "wrong arguments", 4);
            return;
        }

        let isFriend = false;
        for (const friend of user.friends) {
            if (friend[0] === to && friend[1] === true && friend[2] === true) {
                isFriend = true;
                break;
            }
        }

        if (isFriend) {
            const timestamp = new Date();
            sockets.emitEvent(socket, "usermessage", user.name, to, msg, timestamp);
            sockets.sendMsgToUser(user, to, msg, timestamp);
            await messages.addUserMsg(user, to, msg, timestamp);
        } else {
            sockets.sendError(socket, "not a friend of user", 2);
        }
    } catch (err) {
        errHandler.wsErr(err);
    }
}