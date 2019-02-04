import { Database } from "./database";
import { User } from "./types/user";
import { QueryConfig, QueryArrayConfig } from "pg";

export class Messages {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    async addUserMsg(from: User, toname: string, msg: string, timestamp: Date) {
        const msgQuery: QueryConfig = {
            text: `INSERT INTO users_messages (fromID, toID, message, submissionTime)
                        SELECT $1, u.id, $3, $4 FROM users u WHERE u.name = $2`,
            values: [from.id, toname, msg, timestamp]
        };

        await this.database.query(msgQuery);
    }

    async addGroupMsg(from: User, toid: number, msg: string, timestamp: Date) {
        const msgQuery: QueryConfig = {
            text: "INSERT INTO groups_messages (userID, groupID, message, submissionTime) VALUES ($1, $2, $3, $4)",
            values: [from.id, toid, msg, timestamp]
        };

        await this.database.query(msgQuery);
    }

    async getUserChatHistory(user0: User, user1name: string) {
        const user0Query: QueryArrayConfig = {
            text: "SELECT u0.name, u1.name, m.message, m.submissionTime FROM users_messages m, users u1, users u0 WHERE m.fromID = $1 AND m.toID = u1.id AND u1.name = $2 AND m.fromID = u0.id",
            values: [user0.id, user1name],
            rowMode: "array"
        };

        const user1Query: QueryArrayConfig = {
            text: "SELECT u0.name, u1.name, m.message, m.submissionTime FROM users_messages m, users u0, users u1 WHERE m.fromID = u0.id AND m.toID = $1 AND u0.name = $2 AND m.toID = u1.id",
            values: [user0.id, user1name],
            rowMode: "array"
        };

        let rows = (await this.database.query(user0Query)).rows;
        rows = rows.concat((await this.database.query(user1Query)).rows);
        rows.sort((a, b) => new Date(a[3]).valueOf() - new Date(b[3]).valueOf());
        return rows;
    }

    async getGroupChatHistory(groupid: number) {
        const msgQuery: QueryArrayConfig = {
            text: "SELECT u.name, m.message, m.submissionTime FROM groups_messages m, users u WHERE m.groupID = $1 AND u.id = m.userID",
            values: [ groupid ],
            rowMode: "array"
        };
        return (await this.database.query(msgQuery)).rows.sort((a, b) => new Date(a[3]).valueOf() - new Date(b[3]).valueOf());
    }
}