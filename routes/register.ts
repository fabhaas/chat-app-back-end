import express from "express";
import crypto from "crypto";
import { hashPassword } from "../hash";
import { chat } from "../database";

export const router = express.Router();

router.post("/register", async (req, res) => {
    const unexpectedErr = (err : Error, res : express.Response) => { 
        console.error(
            `An exception occurred in a request:
            \t request: ${req.method} from ${req.ip} with the parameters ${req.params}, the body ${req.body}, and the headers ${req.headers}.
            \t exception: ${err}`);
        res.status(500).json({ message: "registration failed: unexcpeted error" });
    };
    const registrationFailed = (res : express.Response, reason : string) => { res.status(400).json("registration failed: " + reason); };

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
        res.send({ message: "success" });
    } catch (err) {
        unexpectedErr(err, res);
    }
});