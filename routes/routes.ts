import * as groups from "./groups";
import * as login from "./login";
import * as register from "./register";

export function mountRoutes(app : Express.Application) {
    app.use("/groups", groups);
    app.use("/login", login);
    app.use("/register", register);
}