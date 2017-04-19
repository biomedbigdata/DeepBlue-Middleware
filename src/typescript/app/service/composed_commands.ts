import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';
import { ProgressElement } from '../service/progresselement';

import { IdName, Name } from '../domain/deepblue';
import { DeepBlueOperation, DeepBlueResult } from '../domain/operations';

/*
dbs.init().subscribe(() => {

    let cc = new ComposedCommands(dbs);

    let progress_bar = new ProgressElement();

    let exp = new IdName("e100269", "HSC_PB_I31_covg./bedgraph");
    let exp2 = new IdName("e100270", "Bcell_PB_I53_fracmeth.bedgraph");
    let exp3 = new IdName("e103786", "wgEncodeBroadHmmK562HMM");
    let exp4 = new IdName("e103787", "wgEncodeBroadHmmNhekHMM");
    let exp5 = new IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp6 = new IdName("e103794", "wgEncodeBroadHmmGm12878HMM");
    let exp7 = new IdName("e103795", "E065_15_coreMarks_mnemonics.bed.bed");
    let exp8 = new IdName("e100277", "MK_BM_I22_covg.bedgraph");

    let ee = new IdName("e100291", "HSC_PB_I30_covg.bedgraph");
    let ff = new IdName("e100296", "RNA_D1_MLP0_100.wig");

    cc.countOverlaps([ff], [exp5, exp6, exp7, exp8, ee, ff]).subscribe((datum: DeepBlueResult[]) => {
        console.log("FINISHED");
    });
});
*/

export class Manager {

    private static dbs: DeepBlueService = new DeepBlueService();
    private static composed_commands: ComposedCommands = null;

    constructor() { }

    static getComposedCommands(): Observable<ComposedCommands> {

        if (this.composed_commands) {
            return Observable.of(this.composed_commands);
        }

        let subject = new Subject<ComposedCommands>();
        this.dbs.init().subscribe(() => {
            this.composed_commands = new ComposedCommands(this.dbs);
            subject.next(this.composed_commands);
            subject.complete();
        })
        return subject.asObservable();
    }
}


export class ComposedCommands {
    constructor(private deepBlueService: DeepBlueService) { }

    selectMultipleExperiments(experiments: Name[], progress_element: ProgressElement): Observable<DeepBlueOperation[]> {

        console.log("selectMultipleExperiments");
        let observableBatch: Observable<DeepBlueOperation>[] = [];

        experiments.forEach((experiment : Name) => {
            console.log("Selecting:",experiment);
            observableBatch.push(this.deepBlueService.selectExperiment(experiment, progress_element));
        });

        return Observable.forkJoin(observableBatch);
    }

    intersectWithSelected(current_operations: DeepBlueOperation[], selected_data: DeepBlueOperation[],
        progress_element: ProgressElement): Observable<DeepBlueOperation[]> {

        let observableBatch: Observable<DeepBlueOperation>[] = [];

        current_operations.forEach((current_op) => {
            selected_data.forEach((data) => {
                let o = this.deepBlueService.intersection(current_op, data, progress_element);
                observableBatch.push(o);
            });
        });

        return Observable.forkJoin(observableBatch);
    }


    countRegionsBatch(query_ids: DeepBlueOperation[], progress_element: ProgressElement): Observable<DeepBlueResult[]> {
        console.log("countRegion");
        let observableBatch: Observable<DeepBlueResult>[] = [];

        query_ids.forEach((op_exp, key) => {
            let o: Observable<DeepBlueResult> = new Observable((observer) => {
                this.deepBlueService.count_regions(op_exp, progress_element).subscribe((result) => {
                    observer.next(result);
                    observer.complete();
                })
            });

            observableBatch.push(o);
        });

        return Observable.forkJoin(observableBatch);
    }


    countOverlaps(data_query_id: DeepBlueOperation[], experiments_name: Name[]): Observable<DeepBlueResult[]> {

        console.log("countOverlaps");

        var start = new Date().getTime();

        let progress_element: ProgressElement = new ProgressElement();
        // Each experiment is started, selected, overlaped, count, get request data (4 times each)
        let total = data_query_id.length * experiments_name.length;
        progress_element.reset(total);

        let response: Subject<DeepBlueResult[]> = new Subject<DeepBlueResult[]>();

        this.selectMultipleExperiments(experiments_name, progress_element).subscribe((selected_experiments: DeepBlueOperation[]) => {
            console.log("selectMultipleExperiments 2");

            this.intersectWithSelected(data_query_id, selected_experiments, progress_element, ).subscribe((overlap_ids: DeepBlueOperation[]) => {
                console.log("intersectWithSelected");

                this.countRegionsBatch(overlap_ids, progress_element).subscribe((datum: DeepBlueResult[]) => {

                    console.log("FINISHED");
                    console.log(datum);
                    var end = new Date().getTime();
                    // Now calculate and output the difference
                    console.log(end - start);
                    response.next(datum);
                    response.complete();
                });
            });
        });

        return response.asObservable();
    }

    private handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            errMsg = JSON.stringify(body);
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.log(errMsg);
        return Observable.throw(errMsg);
    }
}
