//import * as groups from "./groups";
import { loginRoute } from "./login";
import  { registerRoute } from "./register";

export function mountRoutes(app : any) {
    //app.use("/groups", groups);
    app.use("/login", loginRoute);
    app.use("/register", registerRoute);
}