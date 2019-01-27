import * as WebSocket from "ws";
import * as errHandler from "../errHandler";
import { sendMsgToGroup, sendError } from "./sockets";
import { messages } from "../database/database";
import { User } from "../database/types/user";

export async function groupmessage(socket: WebSocket, user: User, to: number, msg: string) {
    try {
        if (typeof to !== "number" || typeof msg !== "string") {
            sendError(socket, "wrong arguments", 4);
            return;
        }
        let isMemOfGroup = false;
        for (const group of (<any>socket).user.groups) {
            if (group[0] === to) {
                sendMsgToGroup(user, to, msg);
                await messages.addGroupMsg(user, to, msg);
                isMemOfGroup = true;
            }
        }

        if (!isMemOfGroup)
            sendError(socket, "not member of group", 3);
    } catch (err) {
        errHandler.wsErr(err);
    }
}