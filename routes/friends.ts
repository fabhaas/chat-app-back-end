import * as express from "express";
import * as errHandling from "../errHandling";
import { chat } from "../database";

export const friendsRoute = express.Router();

friendsRoute.get("/", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("getting friends", err, req,res, 500);
    try {
        res.status(200).json({ groups: await chat.getFriends((req as any).user.id) });
    } catch (err) {
        databaseErr(err);
    }
});

friendsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("making friend", err, req,res, 500);
    const makingFrieFailed = (reason: string, code: number = 400) => errHandling.clientErr("making friend", reason, res, code);

    try {
        await chat.makeFriend((req as any).user, req.params.name);
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
    const databaseErr = (err: Error) => errHandling.databaseErr("breaking off friendship", err, req,res, 500);
    const breakOffFrieFailed = (reason: string) => errHandling.clientErr("breaking off friendship", reason, res, 400);

    try {
        await chat.breakOffFriendship((req as any).user, req.params.name);
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            breakOffFrieFailed("friendship does not exist", )
        }
        databaseErr(err);
    }
});