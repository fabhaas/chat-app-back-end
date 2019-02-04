import { Pool, QueryConfig } from "pg";
import * as fs from "fs";
import { Users } from "./users";
import { Groups } from "./groups";
import { Friends } from "./friends";
import { Messages } from "./messages";

const config = JSON.parse(fs.readFileSync("./config.json").toString());

/**
 * Interface for transaction queries
 */
export interface TransactionQueryConfig extends QueryConfig {
    noAffectedRowsAllowed?: boolean;
}

/**
 * Represents the database
 */
export class Database {
    private pool: Pool;
    constructor(host: string, user: string, password: string, database: string) {
        this.pool = new Pool({
            host: host,
            user: user,
            password: password,
            database: database
        });
        this.pool.on("error", (err, client) => {
            console.error(`Could not connect with database client: ${err}`);
            process.exit(-1);
        });
    }

    /**
     * Executes query on database
     * @param queryconf the query
     */
    query(queryconf: QueryConfig) {
        return this.pool.query(queryconf);
    }

    /**
     * Executes transaction on database
     * @param queries the queries which should be executed
     */
    async executeTransaction(queries: TransactionQueryConfig[]) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            for (const queryconf of queries)
                if (!queryconf.noAffectedRowsAllowed) {
                    if ((await client.query(queryconf)).rowCount === 0)
                        throw -1;
                } else {
                    await client.query(queryconf);
                }

            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }
}

export const database = new Database(
    config.database.host,
    config.database.user,
    config.database.password,
    config.database.database
);

export const users = new Users(database);
export const groups = new Groups(database);
export const friends = new Friends(database);
export const messages = new Messages(database);