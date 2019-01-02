import * as express from "express";
import { chat } from "../database";

export async function routeAuthentication(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authErr = (res: express.Response, reason: string) => { res.status(401).send("authetication failed: " + reason); };
    const unexpectedErr = (err: Error, res : express.Response) => { 
        console.error(
            `An exception occurred in a request:
            \t request: ${req.method} from ${req.ip} with the parameters ${req.params}, the body ${req.body}, and the headers ${req.headers}.
            \t ${err}`);
        res.status(500).send("authentication failed: unexcpeted error");
    };

    try {
        if (!req.headers.authorization) {
            authErr(res, "header authorization not set");
            return;
        }

        const data = JSON.parse(req.headers.authorization);
        const id = await chat.autheticate(data.name, data.token);
        
        if (!id) {
            authErr(res, "wrong username or token");
        } else {
            (req as any).userID = id;
            next();
        }
    } catch (err) {
        unexpectedErr(err, res);
    }
}