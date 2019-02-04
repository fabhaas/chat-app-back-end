import * as express from "express";
import { messages, users } from "../database/database";
import * as errHandler from "../errHandler";
import { sockets } from "../sockets/sockets";

export const userRoute = express.Router();

/**
 * Gets the chat history of two users
 */
userRoute.get("/messages/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting user chat history", err, req, res, 500);
    try {
        res.status(200).json({ messages: await messages.getUserChatHistory((<any>req).user, req.params.name) });
    } catch (err) {
        databaseErr(err);
    }
});

/**
 * Gets all groups of the user
 */
userRoute.get("/groups", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting groups", err, req, res, 500);
    try {
        res.status(200).json({ groups: await users.getGroups((<any>req).user) });
    } catch (err) {
        databaseErr(err);
    }
});

/**
 * Gets all friends of the user
 */
userRoute.get("/friends", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting friends", err, req,res, 500);
    try {
        res.status(200).json({ friends: await users.getFriends((<any>req).user) });
    } catch (err) {
        databaseErr(err);
    }
});

/**
 * Changes the username
 */
userRoute.patch("/name/:newname", async (req, res) => {
    const changingNameFailed = (reason: string, code: number) => errHandler.clientErr("patching username", reason, res, code);
    const databaseErr = (err: Error) => errHandler.databaseErr("patching username", err, req, res, 500);
    try {
        await users.changeUsername((<any>req).user, req.params.newname);
        res.status(200).send();
    } catch (err) {
        if (err.code === "23505") {
            changingNameFailed("user with requested name already exists", 409);
            return;
        }
        databaseErr(err);
    }
});

/**
 * Changes the password of the user
 */
userRoute.patch("/password", async (req, res) => {
    const changingPasswordFailed = (reason: string, code: number) => errHandler.clientErr("patching password", reason, res, code);
    const databaseErr = (err: Error) => errHandler.databaseErr("patching password", err, req, res, 500);

    try {
        if (!req.body) {
            changingPasswordFailed('wrong body', 400);
            return;
        }
        
        if (typeof req.body.oldpassword !== 'string' && typeof req.body.newpassword !== 'string') {
            changingPasswordFailed('wrong body', 400);
            return;
        }

        await users.changePassword((<any>req).user, req.body.oldpassword, req.body.newpassword);
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            changingPasswordFailed('wrong old password', 400);
            return;
        }
        databaseErr(err);
    }
});

/**
 * The user leaves the specified group
 */
userRoute.delete("/groups/:id", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("leaving group", err, req, res, 500);
    const leavingGroup = (reason: string, code: number = 400) => errHandler.clientErr("leaving group", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            leavingGroup("id not parsable");
            return;
        }

        await users.leaveGroup((<any>req).user, req.params.id);
        await sockets.refreshGroup(req.params.id, "members changed");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            leavingGroup("the owner must not leave the group, delete the group instead", 409);
            return;
        }
        if (err === -2) {
            leavingGroup("the user is not member of the group");
            return;
        }
        databaseErr(err);
    }
});