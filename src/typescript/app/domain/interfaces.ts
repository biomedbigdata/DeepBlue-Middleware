export interface ICloneable {
    clone (): any;
}

export interface IKey extends ICloneable {
    key() : string;
}
