"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ComposedData {
    constructor(deepBlueService) {
        this.deepBlueService = deepBlueService;
    }
    /*
  
  loadData() {
      this.deepBlueService.list_epigenetic_marks
    }
  
    getHistones(): Observable<EpigeneticMark[]> {
      if (!this.getGenome()) {
      return Observable.empty<EpigeneticMark[]>();
    }
  const params: URLSearchParams = new URLSearchParams();
  params.set('genome', this.getGenome().name);
  params.set('controlled_vocabulary', 'epigenetic_marks');
  params.set('type', 'peaks');
  return this.http.get(this.deepBlueUrl + '/collection_experiments_count', { 'search': params })
      .map(this.extractHistone)
      .catch(this.handleError);
  
  
      list_epigenetic_marks
  
      infos
  
      make groups
  */
    get_epigenomic_marks_categories(status) {
        return this.deepBlueService.list_epigenetic_marks(status).flatMap((ems) => this.deepBlueService.infos(ems, status));
    }
}
exports.ComposedData = ComposedData;
