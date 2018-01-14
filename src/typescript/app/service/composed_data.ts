import { RequestStatus } from '../domain/status';
import { Observable } from 'rxjs/Observable'
import { Subject } from "rxjs";

import { DeepBlueService } from '../service/deepblue';

import { IdName, Name, Id, FullMetadata, IdNameCount } from '../domain/deepblue';

import {
  DeepBlueIntersection,
  DeepBlueFilter,
  DeepBlueOperation,
  DeepBlueResult,
  FilterParameter,
  DeepBlueMiddlewareOverlapResult,
  DeepBlueResultStatus,
  DeepBlueCommandExecutionResult
} from '../domain/operations';


class CollectionPerGenome {

  constructor(genome: string, total_count: Map<string, number>, categories: string[], epigenetic_marks: FullMetadata[]) { }

}

export class ComposedData {
  constructor(private deepBlueService: DeepBlueService) { }

  categories_epigenetic_marks = new Map<string, Map<string, FullMetadata[]>>();
  epigenetic_mark_categories = new Map<string, Array<string>>();

  private load_epigenetic_marks(genome: string, status: RequestStatus): Observable<Array<string>> {
    return this.deepBlueService.collection_experiments_count(status, "epigenetic_marks", "peaks", genome).flatMap((ems: IdNameCount[]) => {
      return this.deepBlueService.infos(ems, status).map((ems: FullMetadata[]) => {
        let new_categories = new Map<string, Array<FullMetadata>>();
        let new_categories_names = new Set<string>();

        for (let em of ems) {
          let category = em.get_extra_metadata_field('category');
          if (!(category in new_categories)) {
            new_categories[category] = new Array<FullMetadata>();
            new_categories_names.add(category);
          }
          new_categories[category].push(em);
        }

        let categories_vector = Array.from(new_categories_names).sort();

        this.categories_epigenetic_marks[genome] = new_categories;
        this.epigenetic_mark_categories[genome] = categories_vector;

        return categories_vector;
      })
    });
  }

  get_epigenetic_marks_categories(genome: string, status: RequestStatus): Observable<Array<string>> {
    if (!this.epigenetic_mark_categories.get(genome)) {
      return this.load_epigenetic_marks(genome, status);
    } else {
      return Observable.of(this.epigenetic_mark_categories[genome]);
    }
  }

  get_epigenetic_marks(genome: string, category: string, status: RequestStatus): Observable<Array<FullMetadata>> {
    if (!this.categories_epigenetic_marks.get(genome)) {
      return this.load_epigenetic_marks(genome, status).map(() =>
        this.categories_epigenetic_marks[genome][category].sort()
      );

    } else {
      return Observable.of(this.categories_epigenetic_marks[genome][category].sort());
    }
  }


  biosources_related = new Map<string, DeepBlueCommandExecutionResult<string[]>>();
  all_children_biosources(biosource: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {
    let cached = this.biosources_related[biosource];
    if (cached) {
      return Observable.of(cached);
    }

    return this.deepBlueService.get_biosource_children(biosource, status).flatMap((cer: DeepBlueCommandExecutionResult<string[]>) => {
      if (cer.status == DeepBlueResultStatus.Error) {
        return Observable.of(cer);
      }

      let bss = cer.result;
      let all_bs = new Array<Observable<DeepBlueCommandExecutionResult<string[]>>>();
      let bs_names = bss.map((bs) => bs[1]);

      // Skip the first element because it is itself
      for (let name of bs_names) {
        if (name != biosource) {
          all_bs.push(this.all_children_biosources(name, status));
        }
      }

      if (all_bs.length == 0) {
        let r = new DeepBlueCommandExecutionResult(DeepBlueResultStatus.Okay, bs_names);
        this.biosources_related[biosource] = r;
        return Observable.of(r);
      }

      return Observable.forkJoin(all_bs).map((obss) => {
        let bss = obss.map((r) => r.result)
        let os: string[] = [].concat.apply([], bss).concat(bs_names);
        let s = Array.from(new Set(os)).sort();
        let r = new DeepBlueCommandExecutionResult(DeepBlueResultStatus.Okay, s);
        this.biosources_related[biosource] = r;
        return r;
      });
    });
  }


  synonyms_bs(biosource: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {

    return this.all_children_biosources(biosource, status).flatMap((children) => {
      let syn_obs = new Array<Observable<DeepBlueCommandExecutionResult<string[]>>>();

      if (children.status == DeepBlueResultStatus.Error) {
        return Observable.of(children);
      }

      for (let bs of children.result) {
        syn_obs.push(this.deepBlueService.get_biosource_synonyms(bs, status));
      }

      return Observable.forkJoin(syn_obs).map((obss) => {
        let results = obss.map((r) => r.result);
        let syn_arrs = results.map((s) => s[0]);

        let names = [];
        for (let i = 0; i < results.length; i++) {
          for (let j = 0; j < results[i].length; j++) {
            names.push(results[i][j][1]);
          }
        }
        let s = Array.from(new Set(names)).sort();
        let r = new DeepBlueCommandExecutionResult(DeepBlueResultStatus.Okay, s);
        return r;
      });

    });
  }


  relatedBioSources(biosource: string, genome: string, status: RequestStatus): Observable<DeepBlueCommandExecutionResult<string[]>> {

    return this.synonyms_bs(biosource, status).flatMap((related_bss) => {
      if (related_bss.status == DeepBlueResultStatus.Error) {
        return Observable.of(related_bss);
      }

      return this.deepBlueService.collection_experiments_count(status, "biosources", "peaks", genome, "chip-seq").flatMap((bs_counts: IdNameCount[]) => {

        let names = related_bss.result;
        let m = [];
        for (let i = 0; i < names.length; i++) {
          for (let j = 0; j < bs_counts.length; j++) {
            if (names[i] == bs_counts[j].name) {
              m.push(names[i]);
              break;
            }
          }
        }

        return Observable.of(new DeepBlueCommandExecutionResult(DeepBlueResultStatus.Okay, m));
      });
    })
  }
}

