import { Pool } from "pg";
import { config } from "./config";
import crypto from "crypto";

class Chat {
    private pool: Pool;
    constructor() {
        this.pool = new Pool({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });
        this.pool.on("error", (err, client) => {
            console.error(`Could not connect with database client: ${err}`);
            process.exit(-1);
        });
    }

    async registerUser(name: string, passwordHash: string, salt: string) {
        await this.pool.query("INSERT INTO users (name, passwordHash, salt, creationTime) VALUES (?, ?, ?, NOW())", [ name, passwordHash, salt ]);
    }

    async loginUser(name: string, passwordHash: string) {
        const res = await this.pool.query("SELECT id, passwordHash, name, salt FROM users WHERE name = $1", [ name ]);
        const rows = res.rows;

        if (res.rowCount === 0)
            return undefined;
        
        if (rows[0].passwordHash === passwordHash) {
            const token = crypto.randomBytes(1024).toString("hex");
            await this.pool.query("INSERT INTO tokens (userID, token) VALUES ($1, $2)", [ rows[0].id, token ]);
            return token;
        } else {
            return undefined;
        }    
    }
}

export const chat = new Chat();