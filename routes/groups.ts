import * as express from "express";
import { chat } from "../database";
import * as errHandling from "../errHandling";

export const groupsRoute = express.Router();

groupsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("group creation", err, req,res, 500);
    const groupCreaFailed = (reason: string) => errHandling.clientErr("group creation", reason, res, 400);

    try {
        if (!req.body) {
            groupCreaFailed("wrong body");
            return;
        } else if (!Array.isArray(req.body.members)) {
            groupCreaFailed("wrong body");
            return;
        }
        await chat.addGroup(req.params.name, (req as any).userID, req.body.members);
        res.status(201).send();
    } catch (err) {
        databaseErr(err);
    }
});