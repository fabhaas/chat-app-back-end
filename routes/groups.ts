import * as express from "express";
import { chat } from "../database";
import * as errHandling from "../errHandling";

export const groupsRoute = express.Router();

groupsRoute.get("/", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("getting groups", err, req,res, 500);
    try {
        res.status(200).json({ groups: await chat.getGroups((req as any).user.id) });
    } catch (err) {
        databaseErr(err);
    }
});

groupsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("group creation", err, req,res, 500);
    const groupCreaFailed = (reason: string, code: number = 400) => errHandling.clientErr("group creation", reason, res, code);

    try {
        if (!req.body) {
            groupCreaFailed("wrong body");
            return;
        } else if (!Array.isArray(req.body.members)) {
            groupCreaFailed("wrong body");
            return;
        }
        await chat.addGroup(req.params.name, (req as any).user, req.body.members);
        res.status(201).send();
    } catch (err) {
        if (err.code === "23505") {
            groupCreaFailed("group already exists", 409);
            return;
        }
        databaseErr(err);
    }
});

groupsRoute.delete("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("group deletion", err, req,res, 500);

    try {
        await chat.deleteGroup(req.params.name, (req as any).user);
        res.status(200).send();
    } catch (err) {
        databaseErr(err);
    }
});