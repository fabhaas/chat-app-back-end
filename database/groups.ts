import { Database, TransactionQueryConfig } from "./database"
import { User } from "./types/user";
import { QueryConfig, QueryArrayConfig } from "pg";

export enum GroupPatchType {
    name = "name"
}

/**
 * Represents the groups table on the database
 */
export class Groups {
    private database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    /**
     * Checks if the user is the owner of the group
     * @param id the group
     * @param owner the user
     */
    async checkIfOwner(id: number, owner: User) {
        return (await this.database.query({
            text: "SELECT TRUE FROM groups WHERE id = $1 AND ownerID = $2",
            values: [id, owner.id]
        })).rowCount !== 0;
    }

    /**
     * Gets all members of a group
     * @param user the user, has to be part of group or the group owner
     * @param groupid the group
     */
    async getMembers(user: User, groupid: number) {
        if ((await this.database.query({ //test if user is part of group
            text: "SELECT TRUE FROM groups_users WHERE userID = $1 AND groupID = $2 AND isAccepted = TRUE",
            values: [user.id, groupid]
        })).rowCount !== 0 || (await this.database.query({ //or test if user is owner
            text: "SELECT TRUE FROM groups WHERE id = $1 AND ownerID = $2",
            values: [groupid, user.id]
        })).rowCount !== 0) {
            return (await this.database.query(<QueryArrayConfig>{
                text: "SELECT u.name, gu.isAccepted FROM groups_users gu, groups g, users u WHERE g.id = gu.groupID AND g.id = $1 AND gu.userID = u.id",
                values: [groupid],
                rowMode: "array"
            })).rows;
        } else {
            throw -1;
        }
    }

    /**
     * Creates a group
     * @param name the group name
     * @param owner the owner
     * @param members the members
     */
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
        return (await this.database.query({
            text: "SELECT id FROM groups WHERE name = $1 AND ownerID = $2",
            values: [name, owner.id]
        })).rows[0].id;
    }

    /**
     * Changes property of group
     * @param id the group
     * @param owner the owner
     * @param type the property type @see GroupPatchType
     * @param value the new value
     */
    async patch(id: number, owner: User, type: GroupPatchType, value: string) {
        if (!(await this.checkIfOwner(id, owner))) //the group does not belong to the user or does not exist
            throw -1;

        const patchQuery: QueryConfig = {
            text: `UPDATE groups SET ${type.toString()} = $1 WHERE id = $2`,
            values: [value, id]
        };

        await this.database.query(patchQuery);
    }

    /**
     * Removes member from group
     * @param id the group
     * @param owner the owner
     * @param member the member to remove
     */
    async removeMember(id: number, owner: User, member: string) {
        //test if user is owner
        if (!(await this.checkIfOwner(id, owner)))
            throw -1;

        if ((await this.database.query({
            text: "DELETE FROM groups_users USING users WHERE groupID = $1 AND userID = users.id AND users.name = $2",
            values: [id, member]
        })).rowCount === 0)
            throw -2;
    }

    /**
     * Adds members to group
     * @param id the group
     * @param owner the owner
     * @param members the members to add
     */
    async addMembers(id: number, owner: User, members: string[]) {
        //test if user is owner
        if (!(await this.checkIfOwner(id, owner)))
            throw -2;

        const queries: TransactionQueryConfig[] = [];

        for (const member of members) {
            if (member === owner.name)
                continue;
            queries.push({
                name: "addgroupmember",
                text: `INSERT INTO groups_users (userID, groupID, isAccepted) 
                                    SELECT u.id, g.id, FALSE FROM users u, groups g WHERE u.name = $1 AND g.id = $2`,
                values: [member, id]
            });
        }

        await this.database.executeTransaction(queries);
    }

    /**
     * Deletes group
     * @param id the group
     * @param owner the owner
     */
    async delete(id: number, owner: User) {
        //test if user is owner
        if (!(await this.checkIfOwner(id, owner)))
            throw -1;

        //because on cascade delete is set
        await this.database.query({
            text: "DELETE FROM groups WHERE id = $1",
            values: [id]
        });
    }
}