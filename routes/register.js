const crypto = require("crypto");
const router = require("express").Router();
const getDatabase = require("../database").getDatabase;
const hashPassword = require("../hash");

router.post("/:name", (request, result) => {
    const database = getDatabase();
    const loginFailed = (result) => { result.status(401).json( { message: "registration failed: no username or password" } ); };
    const unexpectedErr = (result, err) => {
        console.error("Unexpected error while login:\n\t" + err); 
        result.status(400).json( { message: "registration failed: unexpected error" } );
    };

    if (!request.body) {
        loginFailed(result);
        return;
    } else if (typeof request.body.password !== "string") {
        loginFailed(result);
        return;
    }

    const salt = crypto.randomBytes(1024).toString("hex");
    const passwordHash = hashPassword(
        request.body.password,
        salt
    );

    database.query(
        "INSERT INTO users (name, passwordHash, salt, creationTime) VALUES (?, ?, ?, NOW())",
        [ request.params.name, passwordHash, salt ],
        (err, rows) => {
        if (err) {
            unexpectedErr(result, err);
            return;
        }
        result.send( { message: "success" } );        
    });
});

module.exports = router;