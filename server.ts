import * as express from "express";
import { config } from "./config";
import { mountRoutes } from "./routes/routes";

const app = express();

app.use(express.json()); //enable json bodies
app.use((req, res, next) => {
    //for enabling cors
    /*res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type");*/
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
    next();
});

mountRoutes(app);

app.listen(config.server.port, "localhost", function () {
    console.log(`Server now listening on ${config.server.port}`);
});