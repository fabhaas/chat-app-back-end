import * as express from "express";
import { users } from "../database/database";
import * as errHandler from "../errHandler";

export const loginRoute = express.Router();

loginRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("login", err, req,res, 500);
    const loginFailed = (reason: string) => errHandler.clientErr("login", reason, res, 401);

    try {
        if (!req.body) {
            loginFailed("wrong body");
            return;
        } else if (typeof req.body.password !== "string") {
            loginFailed("wrong username or password");
            return;
        }

        const token = await users.login(req.params.name, req.body.password);

        if (!token)
            loginFailed("wrong username or password");
        else
            res.send({ token: token });
    } catch (err) {
        databaseErr(err);
    }
});