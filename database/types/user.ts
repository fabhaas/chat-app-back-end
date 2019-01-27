export class User {
    public name: string;
    public id: number;
    public friends: Array<any[]> = [ ];
    public groups: Array<any[]> = [ ];

    constructor (name: string, id: number, friends?: Array<any[]>, groups?: Array<any[]>) {
        this.name = name;
        this.id = id;
        if (friends)
            this.friends = friends;
        if (groups)
            this.groups = groups;
    }
}