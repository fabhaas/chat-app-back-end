const crypto = require("crypto"); //for generating token
const router = require("express").Router();
const getDatabase = require("../database").getDatabase;
const hashPassword = require("../hash");

router.post("/:name", (request, result) => {
    const database = getDatabase();
    const loginFailed = (result) => { result.status(401).json( { message: "login failed: wrong username or password" } ); };
    const unexpectedErr = (result, err) => {
        console.error("Unexpected error while login:\n\t" + err); 
        result.status(400).json( { message: "login failed: unexpected error" } );
    };

    if (!request.body) {
        loginFailed(result);
        return;
    } else if (typeof request.body.password !== "string") {
        loginFailed(result);
        return;
    }

    database.query("SELECT id, passwordHash, name, salt FROM users WHERE name = ?", [ request.params.name ], (err0, rows) => {
        if (err0) {
            unexpectedErr(result, err0);
            return;
        }
        
        if (rows.length === 0) {
            loginFailed(result);
            return;
        }

        //verify password
        const passwordHash = hashPassword(
            request.body.password,
            rows[0].salt
        );

        if (rows[0].passwordHash === passwordHash) {
            const token = crypto.randomBytes(1024).toString("hex");
            database.query("INSERT INTO tokens (userID, token) VALUES (?, ?)", [ rows[0].id, token ], (err1, rows) => {
                if (err1) {
                    unexpectedErr(result, err1);
                    return;
                }                
                result.send( { message: "success", token: token } );
            });
        } else {
            loginFailed(result);
            return;
        }
    });
});

module.exports = router;