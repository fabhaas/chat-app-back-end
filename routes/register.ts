import * as express from "express";
import * as crypto from "crypto";
import { hashPassword } from "../hash";
import { chat } from "../database";

export const registerRoute = express.Router();

registerRoute.post("/:name", async (req, res) => {
    const unexpectedErr = (err: Error, res: express.Response) => {
        console.error(
            `An exception occurred in a request:
            \t request: ${req.method} from ${req.ip} with the parameters ${req.params}, the body ${req.body}, and the headers ${req.headers}.
            \t ${err}`);
        res.status(500).send("registration failed: unexcpeted error");
    };
    const registrationFailed = (res: express.Response, reason: string, code: number = 400) => { res.status(code).send("registration failed: " + reason); };

    try {
        if (!req.body) {
            registrationFailed(res, "wrong body");
            return;
        } else if (typeof req.body.password !== "string") {
            registrationFailed(res, "wrong body");
            return;
        }

        const salt = crypto.randomBytes(1024).toString("hex");
        const passwordHash = hashPassword(
            req.body.password,
            salt
        );

        await chat.registerUser(req.params.name, passwordHash, salt);
        res.status(201).send();
    } catch (err) {
        if (err.code === "23505") {
            registrationFailed(res, "user already exists", 409);
            return;
        }
        unexpectedErr(err, res);
    }
});