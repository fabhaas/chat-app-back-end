/**
 * Represents group
 */
export class Group {
    public id: number;
    public name: string;
    public ownerid: number;

    constructor (id: number, name: string, ownerid: number) {
        this.id = id;
        this.name = name;
        this.ownerid = ownerid;
    }
}