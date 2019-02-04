import { Database, groups } from "./database";
import { User } from "./types/user";
import { QueryConfig, QueryArrayConfig } from "pg";
import { hashPassword } from "../hash";
import * as crypto from "crypto";
import { sockets } from "../sockets/sockets";

/**
 * Represents the users table on the database
 */
export class Users {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    /**
     * Gets all friends and groups of user
     * @param user the user, has to have id and name
     */
    async get(user: User) {
        user.friends = await this.getFriends(user);
        user.groups = await this.getGroups(user);
    }

    /**
     * Gets all groups of user
     * @param user the user, has to have id and name
     */
    async getGroups(user: User) {
        const ownerQuery: QueryArrayConfig = {
            text: "SELECT id, name, $1, TRUE FROM groups WHERE ownerID = $2",
            values: [user.name, user.id],
            rowMode: "array"
        };
        const userQuery: QueryArrayConfig = {
            text: "SELECT g.id, g.name, u.name, gu.isAccepted FROM groups_users gu, groups g, users u WHERE g.id = gu.groupID AND gu.userID = $1 AND u.id = g.ownerID",
            values: [user.id],
            rowMode: "array"
        };

        let groups: Array<any[]> = (await this.database.query(ownerQuery)).rows;
        groups = groups.concat((await this.database.query(userQuery)).rows);
        return groups;
    }

    /**
     * Gets all friends of users
     * @param user the user, has to have id
     */
    async getFriends(user: User) {
        const friendsQuery: QueryArrayConfig = {
            text: "SELECT u1.name, f0.isAccepted, f1.isAccepted FROM friends f0, friends f1, users u0, users u1 WHERE f0.userID = u0.id AND f0.friendID = u1.id AND f1.userID = u1.id AND f1.friendID = u0.id AND u0.id = $1",
            values: [user.id],
            rowMode: "array"
        };
        const rows = (await this.database.query(friendsQuery)).rows;
        return rows;
    }

    /**
     * Registers a user
     * @param name the username
     * @param passwordHash the passwordHash @see hashPassword
     * @param salt the salt used to hash the password
     */
    async register(name: string, passwordHash: string, salt: string) {
        const registerQuery: QueryConfig = {
            text: "INSERT INTO users (name, passwordHash, salt, creationTime) VALUES ($1, $2, $3, NOW())",
            values: [name, passwordHash, salt]
        };
        await this.database.query(registerQuery);
    }

    /**
     * Logs user in
     * @param name the username
     * @param password the password of the user
     */
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

    /**
     * User leaves group
     * @param user the user
     * @param groupid the group id
     */
    async leaveGroup(user: User, groupid: number) {
        if ((await groups.checkIfOwner(groupid, user)))
            throw -1;
        
        if ((await this.database.query({
            text: "DELETE FROM groups_users WHERE userID = $1 AND groupID = $2",
            values: [user.id, groupid]
        })).rowCount === 0)
            throw -2;
    }

    /**
     * Authenticates user
     * @param name the username
     * @param token the token, returned by login
     * @returns the authenticated user, else null
     */
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

    /**
     * Accpets group request
     * @param user the user, has to have id
     * @param groupid the group id
     */
    async acceptGroupReq(user: User, groupid: number) {
        const acceptQuery: QueryConfig = {
            text: "UPDATE groups_users SET isAccepted = TRUE WHERE groupID = $1 AND userID = $2",
            values: [groupid, user.id]
        };

        if ((await this.database.query(acceptQuery)).rowCount === 0)
            throw -1;
    }

    /**
     * Accepts friend request
     * @param user the user, has to have 
     * @param friend 
     */
    async acceptFriedReq(user: User, friend: string) {
        const acceptQuery: QueryConfig = {
            text: "UPDATE friends SET isAccepted = TRUE FROM users WHERE friends.userID = $1 AND users.id = friends.friendID AND users.name = $2",
            values: [user.id, friend]
        };

        if ((await this.database.query(acceptQuery)).rowCount === 0)
            throw -1;
    }

    /**
     * Changes the username
     * @param user the user, has to have id
     * @param newname the new name
     */
    async changeUsername(user: User, newname: string) {
        const ret = (await this.database.query({
            text: "UPDATE users SET name = $1 WHERE id = $2",
            values: [newname, user.id]
        })).rowCount;
        await sockets.refreshAll();
        return ret;
    }

    /**
     * Changes the password
     * @param user the user
     * @param oldPassword the old password
     * @param newPassword the new password
     */
    async changePassword(user: User, oldPassword: string, newPassword: string) {
        const rows = (await this.database.query({
            text: "SELECT passwordHash, salt FROM users WHERE id = $1",
            values: [user.id]
        })).rows;

        const oldPasswordHash = hashPassword(oldPassword, rows[0].salt);

        if (rows[0].passwordhash === oldPasswordHash) {
            const salt = crypto.randomBytes(1024).toString("hex");
            const newPasswordHash = hashPassword(
                newPassword,
                salt
            );

            return (await this.database.query({
                text: "UPDATE users SET passwordHash = $1, salt = $2 WHERE id = $3",
                values: [newPasswordHash, salt, user.id]
            })).rowCount;
        } else {
            throw -1;
        }
    }
}