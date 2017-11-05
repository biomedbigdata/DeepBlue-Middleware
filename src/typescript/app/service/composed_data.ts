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
  DeepBlueSelectData,
  DeepBlueTilingRegions,
  DeepBlueArgs,
  DeepBlueMiddlewareOverlapResult
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

        console.log(categories_vector);
        return categories_vector;
      })
    });
  }

  get_epigenetic_marks_categories(genome: string, status: RequestStatus): Observable<Array<string>> {
    console.log("in");
    if (!this.epigenetic_mark_categories.get(genome)) {
      console.log("before load epigenetic marks");
      return this.load_epigenetic_marks(genome, status);
    } else {
      return Observable.of(this.epigenetic_mark_categories[genome]);
    }
  }

  get_epigenetic_marks(genome: string, category: string, status: RequestStatus): Observable<Array<string>> {
    if (!this.categories_epigenetic_marks.get(genome)) {
      return this.load_epigenetic_marks(genome, status).map(() =>
        this.categories_epigenetic_marks[genome][category]
      );

    } else {
      return Observable.of(this.categories_epigenetic_marks[genome][category]);
    }
  }

}

