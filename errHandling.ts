import * as express from "express";

export function databaseErr(processName: string, err: Error, req: express.Request, res: express.Response, retCode: number) {
    console.error(
        `An exception occurred in a request:
        \t request:
        \t\tmethod: ${req.method}
        \t\theaders ${JSON.stringify(req.headers)}
        \t\tip: ${req.ip}
        \t\tparameters: ${JSON.stringify(req.params)}
        \t\tbody: ${JSON.stringify(req.body)}
        \t ${err}`);
    res.status(500).send(`${processName} failed: unexcpeted error`);
}

export function clientErr(processName: string, reason: string, res: express.Response, code: number = 400) {
    res.status(code).send(`${processName} failed: ` + reason);
}