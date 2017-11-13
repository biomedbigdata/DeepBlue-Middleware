import { DeepBlueResult, DeepBlueSelectData, DeepBlueMiddlewareOverlapResult } from './operations';

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

    console.log(arr[0], sd, sd*dropoff_sds, min_value, arr.length, pos);

    return arr.slice(0, pos + 1);
  }

  static percentile(arr: number[], p: number, sort?: boolean, dropoff_sds?: number): number {

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

  request_id: number;

  total_to_load: number = 0;
  total_loaded: number = 0;

  finished = false;

  step: string;

  data: DeepBlueResult[] = new Array<DeepBlueResult>();
  partialData = new Array<Object>();
  summarizedData = null;

  constructor(request_id: number) {
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

  calculateStats(results: number[]): Object {
    let high = Number.MIN_SAFE_INTEGER;
    let low = Number.MAX_SAFE_INTEGER;
    let sum = 0;

    let filterd_results = Statistics.filter(results, 1, true);

    for (const count of filterd_results) {
      if (count < low) {
        low = count;
      }
      if (count > high) {
        high = count;
      }
      sum += count;
    }

    const mean = sum / filterd_results.length;

    const q1 = Statistics.percentile(filterd_results, 0.25);
    const q3 = Statistics.percentile(filterd_results, 0.75);
    const median = Statistics.percentile(filterd_results, 0.5);

    return { low: low, q1: q1, median: median, q3: q3, high: high, mean: mean, elements: filterd_results.length };
  }

  mergePartialData(data: Object[]) {
    let partialData = this.partialData.concat(data);
    this.partialData = partialData;

    partialData.sort((a, b) => b['p_value_log'] - a['p_value_log']);
    let position = 0;
    let value = partialData[0]['p_value_log'];
    for (let i = 0; i < partialData.length; i++) {
      if (partialData[i]['p_value_log'] != value) {
        position = i;
        value = partialData[i]['p_value_log'];
      }
      partialData[i]['log_rank'] = position + 1;
    }

    partialData.sort((a, b) => b['odds_ratio'] - a['odds_ratio']);
    position = 0;
    value = partialData[0]['odds_ratio'];
    for (let i = 0; i < partialData.length; i++) {
      if (partialData[i]['odds_ratio'] != value) {
        position = i;
        value = partialData[i]['odds_ratio'];
      }
      partialData[i]['odd_rank'] = position + 1;
    }

    partialData.sort((a, b) => b['support'] - a['support']);
    position = 0;
    value = partialData[0]['support'];
    for (let i = 0; i < partialData.length; i++) {
      if (partialData[i]['support'] != value) {
        position = i;
        value = partialData[i]['support'];
      }
      partialData[i]['support_rank'] = position + 1;
    }

    for (let ds of partialData) {
      ds['mean_rank'] = (ds['log_rank'] + ds['odd_rank'] + ds['support_rank']) / 3;
      ds['max_rank'] = Math.max(ds['log_rank'], ds['odd_rank'], ds['support_rank']);
    }

    partialData.sort((a, b) => a['mean_rank'] - b['mean_rank']);

    let biosources = {};
    let ems = {};

    for (let ds of partialData) {
      let biosource = ds['biosource'];
      let em = ds['epigenetic_mark'];
      let rank = ds['mean_rank'];

      if (!(biosource in biosources)) {
        biosources[biosource] = [];
      }
      biosources[biosource].push(rank);

      if (!(em in ems)) {
        ems[em] = [];
      }
      ems[em].push(rank);
    }

    let total_bs = Object.keys(biosources).length;
    let total_em = Object.keys(ems).length;

    for (let bs in biosources) {
      const results = biosources[bs];
      biosources[bs] = this.calculateStats(biosources[bs]);
    }

    for (let em in ems) {
      const results = ems[em];
      ems[em] = this.calculateStats(ems[em]);
    }

    this.summarizedData = {
      "biosources": Object.keys(biosources).map((biosource) => [biosource, biosources[biosource]]).sort((a, b) => a[1]['mean'] - b[1]['mean']),
      "epigenetic_marks": Object.keys(ems).map((em) => [em, ems[em]]).sort((a, b) => a[1]['mean'] - b[1]['mean'])
    }
  }

  getPartialData(): Object[] {
    return this.partialData;
  }

  getSummarizedData(): Object {
    return this.summarizedData;
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

