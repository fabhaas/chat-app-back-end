import { groupsRoute } from "./groups";
import { loginRoute } from "./login";
import { registerRoute } from "./register";
import { routeAuthentication } from "./authentication";

export function mountRoutes(app : any) {
    app.use("/groups", routeAuthentication, groupsRoute);
    app.use("/login", loginRoute);
    app.use("/register", registerRoute);
}