import * as WebSocket from "ws";
import * as errHandler from "../errHandler";
import { sockets } from "./sockets";
import { messages } from "../database/database";
import { User } from "../database/types/user";

/**
 * Is called when a groupmessage was received. This function sends the message to the specified group
 * @param socket the socket on which the message was received
 * @param user the sender
 * @param to to whom the message will be send
 * @param msg the message
 */
export async function groupmessage(socket: WebSocket, user: User, to: number, msg: string) {
    try {
        if ((typeof to !== "string" && typeof to !== "number") || typeof msg !== "string") {
            sockets.sendError(socket, "wrong arguments", 4);
            return;
        }

        if (typeof to === "string") {
            if (isNaN(parseInt(to))) {
                sockets.sendError(socket, "wrong arguments", 4);
                return;
            } else {
                to = parseInt(to);
            }
        }

        let isMemOfGroup = false;
        for (const group of (<any>socket).user.groups) {
            if (group[0] === to) {
                isMemOfGroup = true;
                break;
            }
        }

        if (isMemOfGroup) {
            const timestamp = new Date();
            sockets.sendMsgToGroup(user, to, msg, timestamp);
            await messages.addGroupMsg(user, to, msg, timestamp);
        } else {
            sockets.sendError(socket, "not member of group", 3);
        }
    } catch (err) {
        errHandler.wsErr(err);
    }
}