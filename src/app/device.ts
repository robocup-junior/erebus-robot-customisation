export class Device {
    dictName : string;
    name : string;
    customName : string; 
    type : string;
    x : number;
    y : number;
    z : number;
    rx: number;
    ry: number;
    rz: number;
    a: number;
    custom: any[];

    constructor(
        dictName : string, 
        name: string, 
        customName: string, 
        type: string, 
        x: number, 
        y: number, 
        z: number, 
        rx: number, 
        ry: number, 
        rz: number, 
        a: number,
        custom = [],
    ){
        this.dictName = dictName;
        this.name = name;
        this.customName = customName; 
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.a = a;
        this.custom = custom;
    }
}