import * as express from "express";

/**
 * Is called when a database error occurred
 * This function automatically sends the HTTP response
 * @param processName the name of the process in which the error occurred
 * @param err the error
 * @param req the HTTP request
 * @param res the HTTP response
 * @param retCode the HTTP response code
 */
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

/**
 * Is called when an error occurred while using Websokets
 * @param err the error
 */
export function wsErr(err?: Error) {
    if (err)
        console.error(
            `An exception occurred on a websocket: 
            \t${err}`);
}

/**
 * Is called when an user which was caused by an user occurred
 * @param processName the name of the proccess in which the error occurred
 * @param reason the reason why the error occurred
 * @param res the HTTP response
 * @param code the HTTP response code
 */
export function clientErr(processName: string, reason: string, res: express.Response, code: number = 400) {
    res.status(code).send(`${processName} failed: ` + reason);
}