import { DeepBlueResult, DeepBlueMiddlewareOverlapResult } from './operations';

export class Statistics {

  static filter(arr: number[], dropoff_sds: number, sort?: boolean) {
    if (sort) {
      arr.sort(function (a, b) { return a - b; });
    }

    let sum = arr.reduce((p, c) => p + c, 0);
    const mean = sum / arr.length;

    let diffs = [];
    for (let v of arr) {
      diffs.push(Math.pow(v - mean, 2));
    }
    let d = diffs.reduce((a, b, ) => a + b, 0);
    let sd = Math.sqrt(d / (arr.length - 1));

    let min_value = arr[0] + (sd * dropoff_sds);

    let pos = 0;
    for (let n of arr) {
      if (n > min_value) {
        break;
      }
      pos++;
    }

    return arr.slice(0, pos + 1);
  }

  static percentile(arr: number[], p: number, sort?: boolean): number {

    if (arr.length === 0) {
      return 0;
    }

    if (sort) {
      arr.sort(function (a, b) { return a - b; });
    }

    if (p <= 0) {
      return arr[0];
    }
    if (p >= 1) {
      return arr[arr.length - 1];
    }

    const index = (arr.length - 1) * p;
    const lower = Math.floor(index);
    const upper = lower + 1;
    const weight = index % 1;

    if (upper >= arr.length) {
      return arr[lower];
    }

    return arr[lower] * (1 - weight) + arr[upper] * weight;
  }
}

export class RequestStatus {

  request_id: string;

  total_to_load: number = 0;
  total_loaded: number = 0;

  finished = false;
  canceled = false;

  step: string;

  data: DeepBlueResult[] = new Array<DeepBlueResult>();
  partialData = new Array<Object>();
  summarizedData = null;

  constructor(request_id: string) {
    this.request_id = request_id;
  }

  reset(total) {
    this.total_to_load = total;
    this.total_loaded = 0;
    this.step = "";
    this.data = new Array<DeepBlueResult>();
    this.partialData = new Array<Object>();
    this.summarizedData = null;
  }

  increment() {
    this.total_loaded++;
  }

  finish(data: DeepBlueResult[]) {
    this.finished = true;
    this.data = data;
    this.step = "Finished"
  }

  cancel() {
    this.finished = true;
    this.canceled = true;
    this.step = "Canceled";
  }

  setStep(step: string) {
    this.step = step;
  }

  getStep(): string {
    return this.step;
  }

  getProcessed(): number {
    return this.total_loaded;
  }

  getTotal(): number {
    return this.total_to_load;
  }

  addPartialData(data: DeepBlueMiddlewareOverlapResult) {
    this.partialData.push(data);
  }

  mergePartialData(data: Object[]) {
    this.partialData = this.partialData.concat(data);
  }

  getPartialData(): Object[] {
    return this.partialData;
  }

  setData(data: DeepBlueResult[]) {
    this.partialData = [];
    this.data = data;
  }

  getData(): DeepBlueResult[] {
    return this.data;
  }

  getText(): string {
    return `${this.step} : ${this.total_loaded}/${this.total_to_load} (${Math.ceil(this.total_loaded * 100 / this.total_to_load)}%)`;
  }
}

