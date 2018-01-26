import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';
import { request } from 'https';

export class RequestManager {
  requests = new Map<string, RequestStatus>();

  constructor(private request_count: number = 0) {
  }

  startRequest(): RequestStatus {
    let request_id = "mw" + this.request_count++;
    let request_status = new RequestStatus(request_id);
    this.requests[request_id] = request_status;
    return request_status;
  }

  getRequest(request_id: string): RequestStatus {
    return this.requests[request_id];
  }

  cancelRequest(request_id: string) {
    let status = this.requests[request_id];
    status.cancel();
  }
}
