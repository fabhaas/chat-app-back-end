import * as express from "express";
import * as crypto from "crypto";
import { hashPassword } from "../hash";
import { chat } from "../database";
import * as errHandling from "../errHandling";

export const registerRoute = express.Router();

registerRoute.post("/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandling.databaseErr("registration", err, req,res, 500);
    const registrationFailed = (reason: string, code: number = 400) => errHandling.clientErr("registration", reason, res, code);

    try {
        if (!req.body) {
            registrationFailed("wrong body");
            return;
        } else if (typeof req.body.password !== "string") {
            registrationFailed("wrong body");
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
            registrationFailed("user already exists", 409);
            return;
        }
        databaseErr(err);
    }
});