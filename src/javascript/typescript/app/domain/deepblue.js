"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Id {
    constructor(id) {
        this.id = id;
    }
    key() {
        return this.id;
    }
    clone() {
        return new Id(this.id);
    }
    text() {
        return 'ID: ' + this.id;
    }
}
exports.Id = Id;
class Name {
    constructor(name) {
        this.name = name;
    }
    key() {
        return this.name;
    }
    text() {
        throw name;
    }
    clone() {
        return new Name(this.name);
    }
}
exports.Name = Name;
class IdName extends Name {
    constructor(id, name) {
        super(name);
        this.id = id;
        this.name = name;
    }
    key() {
        return this.id.id;
    }
    clone() {
        return new IdName(this.id, this.name);
    }
    text() {
        return this.name + "(" + this.id + ")";
    }
}
exports.IdName = IdName;
class IdNameCount extends IdName {
    constructor(id, name, count) {
        super(id, name);
        this.id = id;
        this.name = name;
        this.count = count;
    }
    Count() {
        return this.count;
    }
    clone() {
        return new IdNameCount(this.id, this.name, this.count);
    }
}
exports.IdNameCount = IdNameCount;
class EpigeneticMark extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.EpigeneticMark = EpigeneticMark;
class BioSource extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.BioSource = BioSource;
class Annotation extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.Annotation = Annotation;
class Experiment extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.Experiment = Experiment;
class Genome extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.Genome = Genome;
class GeneModel extends IdName {
    constructor(data) {
        super(new Id(data[0]), data[1]);
    }
}
exports.GeneModel = GeneModel;
class Gene extends IdName {
    constructor(data) {
        super(new Id(data["_id"]), data["gene_name"]);
        this.data = data;
    }
    gene_id() {
        return this.data["gene_id"];
    }
    gene_name() {
        return this.data["gene_name"];
    }
}
exports.Gene = Gene;
class FullMetadata extends IdName {
    constructor(data) {
        super(data["_id"], data["name"]);
        this.values = data;
    }
    get(key) {
        return this.values[key];
    }
    genome() {
        return this.values["genome"];
    }
    description() {
        return this.values["description"];
    }
    format() {
        return this.values["format"];
    }
    columns() {
        return this.values["columns"];
    }
    biosource() {
        return this.values['sample_info']['biosource_name'];
    }
    type() {
        return this.values["type"];
    }
    get_extra_metadata_field(field) {
        return this.values['extra_metadata'][field];
    }
    clone() {
        return new FullMetadata(this.values);
    }
}
exports.FullMetadata = FullMetadata;
class FullAnnotation extends FullMetadata {
    constructor(data) {
        super(data);
    }
}
exports.FullAnnotation = FullAnnotation;
class FullExperiment extends FullMetadata {
    constructor(data) {
        super(data);
    }
    genome() {
        return this.values["genone"];
    }
    sample_info() {
        return this.values["sample_info"];
    }
    biosource() {
        return this.sample_info()["biosource_name"];
    }
    sample_id() {
        return this.values["sample_id"];
    }
    epigenetic_mark() {
        return this.values["epigenetic_mark"];
    }
    technique() {
        return this.values["technique"];
    }
    project() {
        return this.values["project"];
    }
}
exports.FullExperiment = FullExperiment;
class FullGeneModel extends FullMetadata {
    constructor(data) {
        super(data);
    }
}
exports.FullGeneModel = FullGeneModel;
