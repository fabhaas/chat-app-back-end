import { Database } from "./database";
import { User } from "./types/user";
import { QueryConfig } from "pg";

export class Messages {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    async add(from: User, toname: string, msg: string) {
        const msgQuery: QueryConfig = {
            text: `INSERT INTO messages (fromID, toID, msg, submissionTime)
                        SELECT $1, u.id, $3, NOW() FROM users u WHERE u.name = $2`,
            values: [from.id, toname, msg]
        };

        await this.database.query(msgQuery);
    }
}