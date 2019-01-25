import { Database } from "./database";
import { User } from "./types/user";
import { QueryConfig, QueryArrayConfig } from "pg";
import { Group } from "./types/group";
import { hashPassword } from "../hash";
import * as crypto from "crypto";

export class Users {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    async get(user: User) {
        user.friends = await this.getFriends(user);
        user.groups = await this.getGroups(user);
    }

    async getGroups(user: User) {
        const ownerQuery: QueryConfig = {
            text: "SELECT * FROM groups WHERE ownerID = $1",
            values: [user.id]
        };
        const userQuery: QueryConfig = {
            text: "SELECT g.* FROM groups_users gu, groups g WHERE g.id = gu.groupID AND gu.userID = $1",
            values: [user.id]
        };

        let groups = <Group[]>(await this.database.query(ownerQuery)).rows;
        groups.push.apply(groups, <Group[]>(await this.database.query(userQuery)).rows);
        return groups;
    }

    async getFriends(user: User) {
        const friendsQuery: QueryArrayConfig = {
            text: "SELECT u.name FROM users u, friends f WHERE u.id = f.friendID AND f.userID = $1",
            values: [user.id],
            rowMode: "array"
        };
        const rows = (await this.database.query(friendsQuery)).rows;
        const ret = new Array<string>();

        for (const row of rows)
            ret.push(row[0]);
        return ret;
    }

    async register(name: string, passwordHash: string, salt: string) {
        const registerQuery: QueryConfig = {
            text: "INSERT INTO users (name, passwordHash, salt, creationTime) VALUES ($1, $2, $3, NOW())",
            values: [name, passwordHash, salt]
        };
        await this.database.query(registerQuery);
    }

    async login(name: string, password: string) {
        const authQuery: QueryConfig = {
            text: "SELECT id, passwordHash, name, salt FROM users WHERE name = $1",
            values: [name]
        };
        const res = await this.database.query(authQuery);
        const rows = res.rows;

        if (res.rowCount === 0)
            return null;

        const passwordHash = hashPassword(password, rows[0].salt);

        if (rows[0].passwordhash === passwordHash) {
            const token = crypto.randomBytes(1024).toString("hex");
            const tokenQuery: QueryConfig = {
                text: "INSERT INTO tokens (userID, token) VALUES ($1, $2)",
                values: [rows[0].id, token]
            };

            await this.database.query(tokenQuery);
            return token;
        } else {
            return null;
        }
    }

    async authenticate(name: string, token: string) {
        const authQuery: QueryConfig = {
            text: "SELECT u.id, u.name FROM users u, tokens t WHERE u.name = $1 AND t.userID = u.id AND t.token = $2",
            values: [name, token]
        };

        const res = await this.database.query(authQuery);
        if (res.rowCount === 0)
            return null;
        else
            return new User(res.rows[0].name, res.rows[0].id);
    }

    async acceptGroupReq(user: User, groupid: number) {
        const acceptQuery: QueryConfig = {
            text: "UPDATE groups_users SET isAccepted = TRUE WHERE groupID = $1 AND userID = $2", 
            values: [groupid, user.id]
        };

        if ((await this.database.query(acceptQuery)).rowCount === 0)
            throw -1;
    }

    async acceptFriedReq(user: User, friend: User) {
        const acceptQuery: QueryConfig = {
            text: "UPDATE friends SET isAccepted = TRUE WHERE userID = $1 AND friendID = $2",
            values: [user.id, friend.id]
        };
        
        if ((await this.database.query(acceptQuery)).rowCount === 0)
            throw -1;
    }
}