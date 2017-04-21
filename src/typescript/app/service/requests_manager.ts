import { DeepBlueResult } from '../domain/operations';



export class RequestManager {

  requests = new Map<number, DeepBlueResult | string>();

  constructor(private request_count: number = 0) {
  }

  startRequest() : string {
    let request_id = this.request_count++;
    this.requests[request_id.toLocaleString()] = "new";
    return request_id.toLocaleString();
  }

  getRequest(request_id: string) : DeepBlueResult[] | string {
    return this.requests[request_id];
  }

  storeRequest(request_id: string, data: DeepBlueResult[]) {
    this.requests[request_id] = data;
  }

}