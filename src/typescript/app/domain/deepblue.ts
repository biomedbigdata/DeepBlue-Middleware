import { IKey } from '../domain/interfaces';


export class Id implements IKey {
    constructor(public id: string) { }

    key(): string {
        return this.id;
    }

    clone(): Id {
        return new Id(this.id);
    }

    text() : string {
        return 'ID: ' + this.id;
    }
}

export class Name implements IKey {

    constructor(public name: string) { }

    key(): string {
        return this.name;
    }

    text(): string {
        throw name;
    }

    clone(): Name {
        return new Name(this.name);
    }
}

export class IdName extends Name {
    constructor(public id: Id, public name: string) {
        super(name)
    }

    key(): string {
        return this.id.id;
    }

    clone(): IdName {
        return new IdName(this.id, this.name);
    }

    text() : string {
        return this.name + "(" + this.id + ")";
    }
}

export class IdNameCount extends IdName {

    constructor(public id: Id, public name: string, public count: number) {
        super(id, name);
    }

    Count() : number {
        return this.count;
    }

    clone(): IdName {
        return new IdNameCount(this.id, this.name, this.count);
    }
}


export class EpigeneticMark extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}

export class BioSource extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}

export class Annotation extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}

export class Experiment extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}

export class Genome extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}


export class GeneModel extends IdName {
    constructor(data: string[]) {
        super(new Id(data[0]), data[1])
    }
}

export class Gene extends IdName {
    constructor(private data: {}) {
        super(new Id(data["_id"]), data["gene_name"])
    }

    gene_id(): string {
        return this.data["gene_id"];
    }

    gene_name(): string {
        return this.data["gene_name"];
    }
}

export class FullMetadata extends IdName {
    protected values: Object;

    constructor(data: Object) {
        super(new Id(data["_id"]), data["name"]);
        this.values = data;
    }

    get(key: string): any {
        return this.values[key];
    }

    genome(): string {
        return this.values["genome"];
    }

    project(): string {
        return this.values["project"];
    }

    description(): string {
        return this.values["description"];
    }

    format(): string {
        return this.values["format"];
    }

    columns(): Object {
        return this.values["columns"];
    }

    biosource() : string {
        return this.values['sample_info']['biosource_name'];
    }

    type(): string {
        return this.values["type"];
    }

    get_extra_metadata_field(field: string): string {
        return <string>this.values['extra_metadata'][field];
    }

    clone(): FullMetadata {
        return new FullMetadata(this.values);
    }
}


export class FullAnnotation extends FullMetadata {
    constructor(data: Object) {
        super(data);
    }
}

export class FullExperiment extends FullMetadata {
    constructor(data: Object) {
        super(data);
    }

    genome(): string {
        return this.values["genone"];
    }

    sample_info(): Object {
        return this.values["sample_info"];
    }

    biosource(): string {
        return this.sample_info()["biosource_name"];
    }

    sample_id(): string {
        return this.values["sample_id"];
    }

    epigenetic_mark(): string {
        return this.values["epigenetic_mark"];
    }

    technique(): string {
        return this.values["technique"];
    }

    project(): string {
        return this.values["project"];
    }
}

export class FullGeneModel extends FullMetadata {
    constructor(data: Object) {
        super(data);
    }
}