import * as express from "express";
import { users, groups, messages } from "../database/database";
import * as errHandler from "../errHandler";
import { GroupPatchType } from "../database/groups";
import { sockets } from "../sockets/sockets";

export const groupsRoute = express.Router();

/**
 * Gets all members of a group
 */
groupsRoute.get("/:id", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting group members", err, req, res, 500);
    const groupGetMemFailed = (reason: string, code: number = 400) => errHandler.clientErr("getting group members", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            groupGetMemFailed("id not parsable");
            return;
        }

        res.status(200).json({ members: (await groups.getMembers((<any>req).user, req.params.id)) });
    } catch (err) {
        if (err === -1) {
            groupGetMemFailed("user is not part of group");
            return;
        }
        databaseErr(err);
    }
});

/**
 * Gets the message history of a group
 */
groupsRoute.get("/:id/messages", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting group messages", err, req, res, 500);
    const getGroupMsg = (reason: string, code: number = 400) => errHandler.clientErr("getting group messages", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            getGroupMsg("id not parsable");
            return;
        }

        res.status(200).json({ messages: (await messages.getGroupChatHistory(req.params.id)) });
    } catch (err) {
        databaseErr(err);
    }
});

/**
 * Creates group
 * @returns the id of the newly created group
 */
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

        const groupID = (await groups.add(req.params.name, (<any>req).user, req.body.members));
        await sockets.refreshGroup(groupID, "created");
        res.status(201).json({ id: groupID });
    } catch (err) {
        if (err.code === "23505") {
            groupCreaFailed("group already exists", 409);
            return;
        }
        if (err === -1) {
            groupCreaFailed("some requested members do not exist");
            return;
        }
        databaseErr(err);
    }
});

/**
 * Adds members to group
 */
groupsRoute.post("/:id/members", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("adding group members", err, req,res, 500);
    const addingGroupMemFailed = (reason: string, code: number = 400) => errHandler.clientErr("adding group members", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            addingGroupMemFailed("id not parsable");
            return;
        }

        if (!req.body) {
            addingGroupMemFailed("wrong body");
            return;
        } else if (!Array.isArray(req.body.newmembers)) {
            addingGroupMemFailed("wrong body");
            return;
        }

        await groups.addMembers(req.params.id, (<any>req).user, req.body.newmembers);
        await sockets.refreshGroup(req.params.id, "members changed");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            addingGroupMemFailed("some users cannot be found");
            return;
        }
        if (err === -2) {
            addingGroupMemFailed("the group does not belong to the user or does not exist");
            return;
        }
        databaseErr(err);
    }
});

/**
 * Accepts group request
 */
groupsRoute.patch("/:id/accept", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("accepting group request", err, req,res, 500);
    const groupAccFailed = (reason: string, code: number = 400) => errHandler.clientErr("accepting group request", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            groupAccFailed("id not parsable");
            return;
        }

        await users.acceptGroupReq((<any>req).user, req.params.id);
        await sockets.refreshGroup(req.params.id, "members changed");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            groupAccFailed("the user is not member of the group");
            return;
        }
        databaseErr(err);
    }
});

/**
 * Changes the specified property
 */
groupsRoute.patch("/:id/:type/:value", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("patching group", err, req,res, 500);
    const groupPatchFailed = (reason: string, code: number = 400) => errHandler.clientErr("patching group", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            groupPatchFailed("id not parsable");
            return;
        }

        switch (req.params.type) {
            case "name":
                await groups.patch(req.params.id, (<any>req).user, GroupPatchType.name, req.params.value);
                break;
            default:
                groupPatchFailed("wrong type", 404);
                return;
        }
        await sockets.refreshGroup(req.params.id, "name changed");
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

/**
 * Removes member from group
 */
groupsRoute.delete("/:id/members/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("removing group member", err, req,res, 500);
    const removeMemFailed = (reason: string, code: number = 400) => errHandler.clientErr("removing group member", reason, res, code);

    try {
        if (isNaN(req.params.id)) {
            removeMemFailed("id not parsable");
            return;
        }

        await groups.removeMember(req.params.id, (<any>req).user, req.params.name);
        await sockets.refreshGroup(req.params.id, "members changed");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            removeMemFailed("the group does not exists or is not owned by the user");
            return;
        }

        if (err === -2) {
            removeMemFailed("the user is not part of the group");
            return;
        }
        databaseErr(err);
    }
});

/**
 * Deletes group
 */
groupsRoute.delete("/:id", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("group deletion", err, req,res, 500);
    const groupDeletionFailed = (reason: string) => errHandler.clientErr("group deletion", reason, res, 400);

    try {
        if (isNaN(req.params.id)) {
            groupDeletionFailed("id not parsable");
            return;
        }

        await groups.delete(req.params.id, (<any>req).user);
        await sockets.refreshGroup(req.params.id, "deleted");
        res.status(200).send();
    } catch (err) {
        if (err === -1) {
            groupDeletionFailed("group does not exist or is not owned by the user");
            return;
        }
        databaseErr(err);
    }
});