import * as express from "express";
import { chat } from "../database";
import * as errHandling from "../errHandling";

export const loginRoute = express.Router();

loginRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("login", err, req,res, 500);
    const loginFailed = (reason: string) => errHandling.clientErr("login", reason, res, 401);

    try {
        if (!req.body) {
            loginFailed("wrong body");
            return;
        } else if (typeof req.body.password !== "string") {
            loginFailed("wrong username or password");
            return;
        }

        const token = await chat.loginUser(req.params.name, req.body.password);

        if (!token)
            loginFailed("wrong username or password");
        else
            res.send({ token: token });
    } catch (err) {
        databaseErr(err);
    }
});