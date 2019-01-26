import { groupsRoute } from "./groups";
import { loginRoute } from "./login";
import { registerRoute } from "./register";
import { friendsRoute } from "./friends";
import { routeAuthentication } from "./authentication";
import * as Express from "express";

export function mountRoutes(app: Express.Express) {
    app.use("/groups", routeAuthentication, groupsRoute);
    app.use("/login", loginRoute);
    app.use("/friends", routeAuthentication, friendsRoute);
    app.use("/register", registerRoute);
}