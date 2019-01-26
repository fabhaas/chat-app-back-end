import * as express from "express";
import { messages } from "../database/database";
import * as errHandler from "../errHandler";

export const userRoute = express.Router();

userRoute.get("/messages/:name", async (req, res) => {
    const databaseErr = (err: Error) => errHandler.databaseErr("getting user chat history", err, req, res, 500);
    try {
        res.status(200).json({ messages: await messages.getUserChatHistory((<any>req).user, req.params.name) });
    } catch (err) {
        databaseErr(err);
    }
});