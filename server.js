const express = require("express");
const app = express();
const config = require("./config.json");
const database = require("./database");

console.log("Starting up server...");

//database initialization
database.initDatabase.then(() => {
    console.log("Connected to database:");
    console.log("\t" + database.getDatabase().serverVersion());
    app.listen(config.server.port, () => {
        console.log("Listening on port " + config.server.port + "...");
    });
}, (err) => { 
    console.error("Could not connect to database!:");
    console.error("\t" + err);
    process.exit(-1);
});

//set routes
/*const groupRoute = require("./routes/group");
const loginRoute = require("./routes/login");

//app.use(express.static('public')); // host public folder
app.use("/group", groupRoute);
app.use("/login", loginyRoute);*/
