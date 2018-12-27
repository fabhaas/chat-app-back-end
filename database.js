const config = require("./config.json");
const Client = require("mariasql");

let _database;

let initDatabase = new Promise((resolve, reject) => {
    _database = new Client();
    _database.on("error", function (err) { reject(err); } );
    _database.on("ready", function () { resolve(); } );
    _database.connect({
        host     : config.database.host,
        user     : config.database.user,
        password : config.database.password,
        database : config.database.database
    });
});

function getDatabase() {
    if (!_database) {
        console.error("Database not initialized!");
        return;
    }
    return _database;
}

module.exports = {
    getDatabase,
    initDatabase
};
