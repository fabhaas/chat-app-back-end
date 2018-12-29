const bodyParser = require("body-parser");
const express = require("express");
const config = require("./config.json");
const database = require("./database");
const initSockets = require("./sockets");
//const routeAuthetication = require("./authentication").routeAuthentication;

console.log("Starting up server...");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//set routes
//const groupRoute = require("./routes/group");
const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");

//app.use(express.static('public')); // host public folder
//app.use("/group", routeAuthentication, groupRoute);
app.use("/login", loginRoute);
app.use("/register", registerRoute);

let io;

//database initialization
database.initDatabase.then(() => {
    console.log("Connected to database:");
    console.log("\t" + database.getDatabase().serverVersion());
    
    io = initSockets(app.listen(config.server.port, () => {
        console.log("Listening on port " + config.server.port + "...");
    }));
}, (err) => { 
    console.error("Could not connect to database!:");
    console.error("\t" + err);
    process.exit(-1);
});