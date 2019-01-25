import { Database, TransactionQueryConfig } from "./database"
import { User } from "./types/user";
import { QueryConfig } from "pg";

export enum GroupPatchType {
    name = "name"
}

export class Groups {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    async add(name: string, owner: User, members: string[]) {
        const addGroupQuery: QueryConfig = {
            text: "INSERT INTO groups (name, ownerID) VALUES ($1, $2) RETURNING id",
            values: [name, owner.id]
        };

        const queries: TransactionQueryConfig[] = [addGroupQuery];

        for (const member of members) {
            if (member === owner.name)
                continue;
            queries.push({
                name: "addgroupmember",
                text: `INSERT INTO groups_users (userID, groupID, isAccepted) 
                                SELECT u.id, g.id, FALSE FROM users u, groups g WHERE u.name = $1 AND g.name = $2 AND g.ownerID = $3`,
                values: [member, name, owner.id]
            });
        }

        await this.database.executeTransaction(queries);
    }

    async patch(id: number, owner: User, type: GroupPatchType, value: string) {
        const testQuery: QueryConfig = {
            text: "SELECT id FROM groups WHERE id = $1 AND ownerID = $2",
            values: [id, owner.id]
        };
        const testRes = await this.database.query(testQuery);

        if (testRes.rowCount === 0) //the group does not belong to the user or does not exist
            throw -1;

        const patchQuery: QueryConfig = {
            text: `UPDATE groups SET ${type.toString()} = $1 WHERE id = $2`,
            values: [value, testRes.rows[0].id]
        };

        await this.database.query(patchQuery);
    }

    async delete(id: number, owner: User) {
        const testQuery: QueryConfig = {
            text: "SELECT id FROM groups WHERE id = $1 AND ownerID = $2",
            values: [id, owner.id]
        }

        if ((await this.database.query(testQuery)).rowCount === 0)
            throw -1;

        const queries: TransactionQueryConfig[] = [{
            text: "DELETE FROM groups_users USING groups WHERE groupID = groups.id AND groups.id = $1 AND groups.ownerID = $2",
            values: [id, owner.id],
            noAffectedRowsAllowed: true
        }, {
            text: "DELETE FROM groups WHERE name = $1 AND ownerID = $2",
            values: [name, owner.id]
        }];

        await this.database.executeTransaction(queries);
    }
}