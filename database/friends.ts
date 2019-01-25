import { Database, TransactionQueryConfig } from "./database";
import { User } from "./types/user";
import { QueryConfig } from "pg";

export class Friends {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    async make(user: User, friendname: string) {
        const queries: QueryConfig[] = [{
          text: `INSERT INTO friends (userID, friendID, isAccepted)
                        SELECT $1, id, TRUE FROM users WHERE name = $2`, 
          values: [user.id, friendname]  
        }, {
            text: `INSERT INTO friends (userID, friendID, isAccepted)
                        SELECT id, $1, FALSE FROM users WHERE name = $2`,
            values: [user.id, friendname]
        }];

        await this.database.executeTransaction(queries);
    }

    async breakOff(user: User, friendname: string) {
        const queries: TransactionQueryConfig[] = [{
            text: "DELETE FROM friends USING users WHERE userID = $1 AND friendID = users.id AND users.name = $2",
            values: [ user.id, friendname],
        }, {
            text: "DELETE FROM friends USING users WHERE userID = users.name AND friendID = $1 AND users.name = $2",
            values: [ user.id, friendname ]
        }];

        await this.database.executeTransaction(queries);
    }
}