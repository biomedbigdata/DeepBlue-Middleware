import { RequestStatus } from '../domain/status';
import { DeepBlueResult } from '../domain/operations';

export class RequestManager {
  requests = new Map<number, RequestStatus>();

  constructor(private request_count: number = 0) {
  }

  startRequest() : RequestStatus {
    let request_id = this.request_count++;
    let request_status = new RequestStatus(request_id);
    this.requests[request_id.toLocaleString()] = request_status;
    return request_status;
  }

  getRequest(request_id: string) : RequestStatus {
    return this.requests[request_id];
  }
}
