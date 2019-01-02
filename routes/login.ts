import * as express from "express";
import { chat } from "../database";

export const loginRoute = express.Router();

loginRoute.post("/:name", async (req, res) => {
    const unexpectedErr = (err: Error, res: express.Response) => {
        console.error(
            `An exception occurred in a request:
            \t request: ${req.method} from ${req.ip} with the parameters ${req.params}, the body ${req.body}, and the headers ${req.headers}.
            \t ${err}`);
        res.status(500).send("login failed: unexcpeted error");
    };
    const loginFailed = (res: express.Response, reason: string) => { res.status(401).send("login failed: " + reason); };

    try {
        if (!req.body) {
            loginFailed(res, "wrong body");
            return;
        } else if (typeof req.body.password !== "string") {
            loginFailed(res, "wrong username or password");
            return;
        }

        const token = await chat.loginUser(req.params.name, req.body.password);

        if (!token)
            loginFailed(res, "wrong username or password");
        else
            res.send({ token: token });
    } catch (err) {
        unexpectedErr(err, res);
    }
});