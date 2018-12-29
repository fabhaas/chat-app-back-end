const getDatabase = require("./database").getDatabase;

function authenticate (name, token, onsuccess, onerr) {
    const database = getDatabase();

    database.query("SELECT t.token, u.id FROM tokens t, users u WHERE u.name = ? AND t.userID = u.id",
     [ name ],
     (err, rows) => {
        if (err) {
            console.error("While autheticating:\n\t" + err);
            onerr();
            return;
        }

        if (rows.length === 0) {
            onerr();
            return;
        }

        let isValid = false;
        for (const t of rows) {
            if (token === t.token) {
                isValid = true;
                break;
            }
        }

        if (isValid) {
            onsuccess(rows[0].id);
        }
        else
            onerr();
    });
}

function routeAuthentication (request, result, next) {
    const authErr = (result) => { result.status(401).json( { message: "authentication error" } ); };

    if (!request.headers.authorization) {
        authErr(result);
        return;
    }
    const data = JSON.parse(request.headers.authorization);
    const name = data.name;
    const token = data.token;

    authenticate(name, token, (userID) => {
        request.userID = userID;
        next();
    }, () => {
        authErr(result);
    });
}

module.exports = {
    authenticate,
    routeAuthentication
};