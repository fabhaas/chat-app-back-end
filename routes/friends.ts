import * as express from "express";
import * as errHandler from "../errHandler";
import { friends, users } from "../database/database";
import { sockets } from "../sockets/sockets";

export const friendsRoute = express.Router();

friendsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("making friend", err, req,res, 500);
    const makingFrieFailed = (reason: string, code: number = 400) => errHandler.clientErr("making friend", reason, res, code);

    try {
        await friends.make((<any>req).user, req.params.name);
        await sockets.refreshFriend((<any>req).user.name, req.params.name, "created");
        res.status(201).send();
    } catch (err) {
        if (err === -1) {
            makingFrieFailed("user does not exist");
            return;
        }
        if (err.code === "23505") {
            makingFrieFailed("friendship already exists or is requested", 409);
            return;
        }
        databaseErr(err);
    }
});

friendsRoute.patch("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("making friend", err, req,res, 500);
    const acceptFriendReqFailed = (reason: string, code: number = 400) => errHandler.clientErr("accepting friend req", reason, res, code);

    try {
        await users.acceptFriedReq((<any>req).user, req.params.name);
        await sockets.refreshFriend((<any>req).user.name, req.params.name, "accepted");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            acceptFriendReqFailed("there is no friend request to accept");
            return;
        }
        databaseErr(err);
    }
});

friendsRoute.delete("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("breaking off friendship", err, req,res, 500);
    const breakOffFrieFailed = (reason: string) => errHandler.clientErr("breaking off friendship", reason, res, 400);

    try {
        await friends.breakOff((<any>req).user, req.params.name);
        await sockets.refreshFriend((<any>req).user.name, req.params.name, "deleted");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            breakOffFrieFailed("friendship does not exist");
            return;
        }
        databaseErr(err);
    }
});