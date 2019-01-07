import { groupsRoute } from "./groups";
import { loginRoute } from "./login";
import { registerRoute } from "./register";
import { friendsRoute } from "./friends";
import { routeAuthentication } from "./authentication";

export function mountRoutes(app : any) {
    app.use("/groups", routeAuthentication, groupsRoute);
    app.use("/login", loginRoute);
    app.use("/friends", routeAuthentication, friendsRoute);
    app.use("/register", registerRoute);
}