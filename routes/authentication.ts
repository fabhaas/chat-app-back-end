import * as express from "express";
import { chat } from "../database";
import * as errHandling from "../errHandling";

export async function routeAuthentication(req: express.Request, res: express.Response, next: express.NextFunction) {
    const databaseErr = (err: Error) => errHandling.databaseErr("authentication", err, req,res, 500);
    const authErr = (reason: string) => errHandling.clientErr("authentication", reason, res, 401);

    try {
        if (!req.headers.authorization) {
            authErr("header authorization not set");
            return;
        }

        const data = JSON.parse(req.headers.authorization);
        const id = await chat.autheticate(data.name, data.token);
        
        if (!id) {
            authErr("wrong username or token");
        } else {
            (req as any).userID = id;
            next();
        }
    } catch (err) {
        databaseErr(err);
    }
}