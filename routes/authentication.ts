import * as express from "express";
import { users } from "../database/database";
import * as errHandler from "../errHandler";

export async function routeAuthentication(req: express.Request, res: express.Response, next: express.NextFunction) {
    const databaseErr = (err: Error) => errHandler.databaseErr("authentication", err, req,res, 500);
    const authErr = (reason: string) => errHandler.clientErr("authentication", reason, res, 401);

    try {
        if (!req.headers.authorization) {
            authErr("header authorization not set");
            return;
        }

        const data = JSON.parse(req.headers.authorization);
        if (!data.name || !data.token) {
            authErr("header authorization not set properly");
            return;
        }

        const user = await users.authenticate(data.name, data.token);
        
        if (!user) {
            authErr("wrong username or token");
        } else {
            (<any>req).user = user;
            next();
        }
    } catch (err) {
        databaseErr(err);
    }
}