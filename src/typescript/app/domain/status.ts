import { DeepBlueResult, DeepBlueSelectData, DeepBlueMiddlewareOverlapResult } from './operations';

export class RequestStatus {

  request_id: number;

  total_to_load: number = 0;
  total_loaded: number = 0;

  finished = false;

  step: string;

  data: DeepBlueResult[] = new Array<DeepBlueResult>();
  partialData = new Array<Object>();

  constructor(request_id: number) {
    this.request_id = request_id;
  }

  reset(total) {
    this.total_to_load = total;
    this.total_loaded = 0;
    this.step = "";
    this.data = new Array<DeepBlueResult>();
    this.partialData = new Array<Object>();
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

  getProcessed() : number {
    return this.total_loaded;
  }

  getTotal() : number {
    return this.total_to_load;
  }

  addPartialData(data: DeepBlueMiddlewareOverlapResult) {
    this.partialData.push(data);
  }

  mergePartialData(data: Object[]) {
    let merged = this.partialData.concat(data);

    merged.sort((a, b) => a['p_value_log'] - b['p_value_log']);

    let position = 0;
    let value = merged[0]['p_value_log'];
    for (let i = 0; i < merged.length; i++) {
      if (merged[i]['p_value_log'] != value) {
        position = i;
        value = merged[i]['p_value_log'];
      }
      merged[i]['log_rank'] = position + 1;
    }

    merged.sort((a, b) => a['odds_ratio'] - b['odds_ratio']);
    position = 0;
    value = merged[0]['odds_ratio'];
    for (let i = 0; i < merged.length; i++) {
      if (merged[i]['odds_ratio'] != value) {
        position = i;
        value = merged[i]['odds_ratio'];
      }
      merged[i]['odd_rank'] = position + 1;
    }

    merged.sort((a, b) => a['support'] - b['support']);
    position = 0;
    value = merged[0]['support'];
    for (let i = 0; i < merged.length; i++) {
      if (merged[i]['support'] != value) {
        position = i;
        value = merged[i]['support'];
      }
      merged[i]['support_rank'] = position + 1;
    }

    for (let ds of merged) {
      ds['mean_rank'] = ds['log_rank'] + ds['odd_rank'] + ds['support_rank'];
      ds['max_rank'] = Math.max(ds['log_rank'], ds['odd_rank'], ds['support_rank']);
    }

    merged.sort((a, b) => a['mean_rank'] - b['mean_rank']);

    console.log(merged);

    this.partialData = merged;
  }

  getPartialData() : Object[] {
    return this.partialData;
  }

  setData(data: DeepBlueResult[]) {
    this.partialData  = [];
    this.data = data;
  }

  getData(): DeepBlueResult[] {
    return this.data;
  }

  getText() : string {
    return `${this.step} : ${this.total_loaded}/${this.total_to_load} (${Math.ceil(this.total_loaded * 100 / this.total_to_load)}%)`;
  }
}

