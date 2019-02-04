import { User } from "../database/types/user";
import * as WebSocket from "ws";
import { sockets } from "./sockets";
import { messages } from "../database/database";
import * as errHandler from "../errHandler";

/**
 * Is called when an user message was received
 * @param socket the socket on which the message was received
 * @param user the authenticated user which uses the socket
 * @param to to whom the message will be sent
 * @param msg the message
 */
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