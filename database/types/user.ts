import { Group } from "./group";

export class User {
    public name: string;
    public id: number;
    public friends: Array<string> = [ ];
    public groups: Array<Group> = [ ];

    constructor (name: string, id: number, friends?: Array<string>, groups?: Array<Group>) {
        this.name = name;
        this.id = id;
        if (friends)
            this.friends = friends;
        if (groups)
            this.groups = groups;
    }
}