import * as express from "express";
import * as errHandler from "../errHandler";
import { friends, users } from "../database/database";

export const friendsRoute = express.Router();

friendsRoute.get("/", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting friends", err, req,res, 500);
    try {
        res.status(200).json({ groups: await users.getFriends((<any>req).user) });
    } catch (err) {
        databaseErr(err);
    }
});

friendsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("making friend", err, req,res, 500);
    const makingFrieFailed = (reason: string, code: number = 400) => errHandler.clientErr("making friend", reason, res, code);

    try {
        await friends.make((<any>req).user, req.params.name);
        res.status(201).send();
    } catch (err) {
        if (err.code === "23505") {
            makingFrieFailed("friendship already exists or is requested", 409);
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
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            breakOffFrieFailed("friendship does not exist", )
        }
        databaseErr(err);
    }
});