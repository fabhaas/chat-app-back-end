import * as express from "express";
import { users, groups } from "../database/database";
import * as errHandler from "../errHandler";
import { GroupPatchType } from "../database/groups";

export const groupsRoute = express.Router();

groupsRoute.get("/", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting groups", err, req,res, 500);
    try {
        res.status(200).json({ groups: await users.getGroups((<any>req).user) });
    } catch (err) {
        databaseErr(err);
    }
});

groupsRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("group creation", err, req,res, 500);
    const groupCreaFailed = (reason: string, code: number = 400) => errHandler.clientErr("group creation", reason, res, code);

    try {
        if (!req.body) {
            groupCreaFailed("wrong body");
            return;
        } else if (!Array.isArray(req.body.members)) {
            groupCreaFailed("wrong body");
            return;
        }

        const groupID = await groups.add(req.params.name, (<any>req).user, req.body.members);
        res.status(201).json({ id: groupID });
    } catch (err) {
        /*if (err.code === "23505") {
            groupCreaFailed("group already exists", 409);
            return;
        }*/
        databaseErr(err);
    }
});

groupsRoute.patch("/:id/accept", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("accepting group request", err, req,res, 500);
    const groupAccFailed = (reason: string, code: number = 400) => errHandler.clientErr("accepting group request", reason, res, code);

    try {
        await users.acceptGroupReq((<any>req).user, req.params.id);
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
    const databaseErr = (err: Error) => errHandler.databaseErr("patching group", err, req,res, 500);
    const groupPatchFailed = (reason: string, code: number = 400) => errHandler.clientErr("patching group", reason, res, code);

    try {
        switch (req.params.type) {
            case "name":
                await groups.patch(req.params.id, (<any>req).owner, GroupPatchType.name, req.params.value);
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
    const databaseErr = (err: Error) => errHandler.databaseErr("group deletion", err, req,res, 500);
    const groupDeletionFailed = (reason: string) => errHandler.clientErr("group deletion", reason, res, 400);

    try {
        await groups.delete(req.params.id, (<any>req).user);
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            groupDeletionFailed("group does not exist or is not owned by user");
            return;
        }
        databaseErr(err);
    }
});