export class ProgressElement {

    total_to_load: number = 0;
    total_loaded: number = 0;

    reset(total) {
        this.total_to_load  = total;
        this.total_loaded = 0;
    }

    increment() {
        this.total_loaded++;
        let next_value = Math.ceil(this.total_loaded * 100 / this.total_to_load);
    }
}
