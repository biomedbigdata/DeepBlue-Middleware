import { ComposedCommands } from './composed_commands';
import { DeepBlueService } from './deepblue';
import { ComposedQueries } from './composed_queries';
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs";

export class Manager {

  private static dbs: DeepBlueService = new DeepBlueService();
  private static composed_commands: ComposedCommands = null;
  private static composed_queries: ComposedQueries = null;

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

  static getComposedQueries(): Observable<ComposedQueries> {

    if (this.composed_queries) {
      return Observable.of(this.composed_queries);
    }

    let subject = new Subject<ComposedQueries>();
    this.dbs.init().subscribe(() => {
      this.composed_queries = new ComposedQueries(this.dbs);
      subject.next(this.composed_queries);
      subject.complete();
    })
    return subject.asObservable();
  }
}
