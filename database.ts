import { Pool } from "pg";
import * as crypto from "crypto";
import { config } from "./config";
import { hashPassword } from "./hash";

export enum groupPatchType {
    name = "name"
}
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

    async getGroups(userID: number) {
        let groups = (await this.pool.query("SELECT * FROM groups WHERE ownerID = $1", [userID])).rows;
        groups.push.apply(groups, (await this.pool.query("SELECT g.* FROM groups_users gu, groups g WHERE g.id = gu.groupID AND gu.userID = $1", [userID])).rows);
        return groups;
    }

    async addGroup(name: string, owner: any, members: string[]) {
        const client = await this.pool.connect();
        try {
            const id: number = (await client.query("INSERT INTO groups (name, ownerID) VALUES ($1, $2) RETURNING id", [name, owner.id])).rows[0].id;
            await client.query('BEGIN');

            const addMemConf = {
                name: "addgroupmember",
                text: `INSERT INTO groups_users (userID, groupID, isAccepted) 
                            SELECT u.id, g.id, FALSE FROM users u, groups g WHERE u.name = $1 AND g.name = $2 AND g.ownerID = $3`,
                values: ["", name, owner.id]
            }
            for (let member of members) {
                if (member === owner.name)
                    continue;
                addMemConf.values[0] = member;
                await client.query(addMemConf);
            }
            await client.query('COMMIT');
            return id;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async acceptGroupReq(id: number, user: any) {
        const count = (await this.pool.query("UPDATE groups_users SET isAccepted = TRUE WHERE groupID = $1 AND userID = $2", [id, user.id])).rowCount;
        if (count === 0)
            throw -1;
    }

    async patchGroup(type: groupPatchType, value: string, id: number, owner: any) {
        const testRes = await this.pool.query("SELECT id FROM groups WHERE id = $1 AND ownerID = $2", [id, owner.id]);
        if (testRes.rowCount === 0) //the group does not belong to the user or does not exist
            throw -1;

        await this.pool.query(`UPDATE groups SET ${type.toString()} = $1 WHERE id = $2`, [value, testRes.rows[0].id]);
    }

    async deleteGroup(id: number, owner: any) {
        const client = await this.pool.connect();
        try {
            if ((await client.query("SELECT id FROM groups WHERE id = $1 AND ownerID = $2", [id, owner.id])).rowCount === 0)
                throw -1;
            await client.query('BEGIN');
            await client.query("DELETE FROM groups_users USING groups WHERE groupID = groups.id AND groups.id = $1 AND groups.ownerID = $2", [id, owner.id]);
            await client.query("DELETE FROM groups WHERE name = $1 AND ownerID = $2", [name, owner.id]);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getFriends(user: any) {
        return (await this.pool.query("SELECT u.name FROM user u, friends f WHERE u.id = f.friendID AND f.userID = $1", [user.id])).rows;
    }

    async makeFriend(user: any, friendname: string) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`INSERT INTO friends (userID, friendID, isAccepted)
                                    SELECT $1, id, TRUE FROM users WHERE name = $2`, [user.id, friendname]);
            await client.query(`INSERT INTO friends (userID, friendID, isAccepted)
                                    SELECT id, $1, FALSE FROM users WHERE name = $2`, [user.id, friendname]);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async breakOffFriendship(user: any, friendname: string) {
        
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

    async autheticate(name: string, token: string) {
        const res = await this.pool.query("SELECT u.id, u.name FROM users u, tokens t WHERE u.name = $1 AND t.userID = u.id AND t.token = $2", [name, token]);
        if (res.rowCount === 0)
            return undefined;
        else
            return res.rows[0];
    }
}

export const chat = new Chat();