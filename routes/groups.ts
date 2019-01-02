import * as express from "express";
import { chat } from "../database";

export const groupsRoute = express.Router();

groupsRoute.post("/:name", async (req, res) => {
    const unexpectedErr = (err: Error, res: express.Response) => {
        console.error(
            `An exception occurred in a request:
            \t request: ${req.method} from ${req.ip} with the parameters ${req.params}, the body ${req.body}, and the headers ${req.headers}.
            \t ${err}`);
        res.status(500).send("group creation failed: unexcpeted error");
    };
    const groupCreaFailed = (res: express.Response, reason: string) => { res.status(400).send("group creation failed: " + reason); };

    try {
        if (!req.body) {
            groupCreaFailed(res, "wrong body");
            return;
        } else if (!Array.isArray(req.body.members)) {
            groupCreaFailed(res, "wrong body");
            return;
        }
        await chat.addGroup(req.params.name, (req as any).userID, req.body.members);
        res.status(201).send();
    } catch (err) {
        unexpectedErr(err, res);
    }
});