import { DeepBlueResult, DeepBlueSelectData, DeepBlueMiddlewareOverlapResult } from './operations';

export class RequestStatus {

  request_id: number;

  total_to_load: number = 0;
  total_loaded: number = 0;

  finished = false;

  step: string;

  data: DeepBlueResult[] = new Array<DeepBlueResult>();
  partialData = new Array<DeepBlueMiddlewareOverlapResult>();

  constructor(request_id: number) {
    this.request_id = request_id;
  }

  reset(total) {
    this.total_to_load = total;
    this.total_loaded = 0;
    this.step = "";
    this.data = new Array<DeepBlueResult>();
    this.partialData = new Array<DeepBlueMiddlewareOverlapResult>();
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

  getPartialData() : DeepBlueMiddlewareOverlapResult[] {
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

