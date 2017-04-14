export class ProgressElement {

    total_to_load: number = 0;
    total_loaded: number = 0;
    request_count: number = -1;

    reset(total, request_count) {
        this.total_to_load  = total;
        this.total_loaded = 0;
        this.request_count = request_count;
    }

    increment(request_count: number) {
        if (request_count != this.request_count) {
            return;
        }
        this.total_loaded++;

        let next_value = Math.ceil(this.total_loaded * 100 / this.total_to_load);
    }
}
