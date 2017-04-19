"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Name {
    constructor(name) {
        this.name = name;
    }
    key() {
        return this.name;
    }
    clone() {
        return new Name(this.name);
    }
}
exports.Name = Name;
class IdName {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    key() {
        return this.id;
    }
    clone() {
        return new IdName(this.id, this.name);
    }
}
exports.IdName = IdName;
class IdNameCount extends IdName {
    constructor(data) {
        super(data[0], data[1]);
        this.count = parseInt(data[2]);
    }
}
exports.IdNameCount = IdNameCount;
class EpigeneticMark extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.EpigeneticMark = EpigeneticMark;
class BioSource extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.BioSource = BioSource;
class Annotation extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.Annotation = Annotation;
class Experiment extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.Experiment = Experiment;
class Genome extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.Genome = Genome;
class GeneModel extends IdName {
    constructor(data) {
        super(data[0], data[1]);
    }
}
exports.GeneModel = GeneModel;
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
}
exports.FullMetadata = FullMetadata;
class FullAnnotation extends FullMetadata {
    constructor(data) {
        super(data);
    }
}
exports.FullAnnotation = FullAnnotation;
class FullGeneModel extends FullMetadata {
    constructor(data) {
        super(data);
    }
}
exports.FullGeneModel = FullGeneModel;
class FullExperiment extends FullMetadata {
    constructor(data) {
        super(data);
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
