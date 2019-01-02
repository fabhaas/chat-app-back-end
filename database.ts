import { Pool } from "pg";
import * as crypto from "crypto";
import { config } from "./config";
import { hashPassword } from "./hash";

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
        await this.pool.query("INSERT INTO users (name, passwordHash, salt, creationTime) VALUES ($1, $2, $3, NOW())", [name, passwordHash, salt]);
    }

    async loginUser(name: string, password: string) {
        const res = await this.pool.query("SELECT id, passwordHash, name, salt FROM users WHERE name = $1", [name]);
        const rows = res.rows;

        if (res.rowCount === 0)
            return undefined;

        const passwordHash = hashPassword(password, rows[0].salt);

        if (rows[0].passwordhash === passwordHash) {
            const token = crypto.randomBytes(1024).toString("hex");
            await this.pool.query("INSERT INTO tokens (userID, token) VALUES ($1, $2)", [rows[0].id, token]);
            return token;
        } else {
            return undefined;
        }
    }

    async addGroup(name: string, ownerID: number, members: string[]) {
        const client = await this.pool.connect();
        try {
            await client.query("INSERT INTO groups (name) VALUES ($1)", [name]);
            await client.query('BEGIN');

            const addMemConf = {
                name: "addgroupmember",
                text: `INSERT INTO groups_users (userID, groupID, isConfirmed) 
                            SELECT u.id, g.id, FALSE FROM users u, groups g WHERE u.name = $1 AND g.name = '${name}' AND g.ownerID = ${ownerID}`,
                values: [ "" ]
            }
            for (let member of members) {
                addMemConf.values = [member];
                await client.query(addMemConf);
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async autheticate(name: string, token: string) {
        const res = await this.pool.query("SELECT u.id FROM users u, tokens t WHERE u.name = $1 AND t.userID = u.id AND t.token = $2", [ name, token ]);
        if (res.rowCount === 0)
            return undefined;
        else
            return res.rows[0].id;
    }
}

export const chat = new Chat();