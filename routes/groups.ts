import * as express from "express";
import { chat, groupPatchType } from "../database";
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

        const groupID = await chat.addGroup(req.params.name, (req as any).user, req.body.members);
        res.status(201).json({ id: groupID });
    } catch (err) {
        if (err.code === "23505") {
            groupCreaFailed("group already exists", 409);
            return;
        }
        databaseErr(err);
    }
});

groupsRoute.patch("/:id/accept", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("accepting group request", err, req,res, 500);
    const groupAccFailed = (reason: string, code: number = 400) => errHandling.clientErr("accepting group request", reason, res, code);

    try {
        await chat.acceptGroupReq(req.params.id, (req as any).user);
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            groupAccFailed("the user is not member of the group");
            return;
        }
        databaseErr(err);
    }
});

groupsRoute.patch("/:id/:type/:value", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("patching group", err, req,res, 500);
    const groupPatchFailed = (reason: string, code: number = 400) => errHandling.clientErr("patching group", reason, res, code);

    try {
        switch (req.params.type) {
            case "name":
                await chat.patchGroup(groupPatchType.name, req.params.value, req.params.id, (req as any).owner.id);
                break;
            default:
                groupPatchFailed("wrong type", 404);
                return;
        }
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            groupPatchFailed("the group does not belong to the user or does not exist");
            return;
        }
        if (err.code === "23505") {
            groupPatchFailed("a group with that name is already owned by the user");
            return;
        }
        databaseErr(err);
    }
});

groupsRoute.delete("/:id", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("group deletion", err, req,res, 500);

    try {
        await chat.deleteGroup(req.params.id, (req as any).user);
        res.status(200).send();
    } catch (err) {
        databaseErr(err);
    }
});