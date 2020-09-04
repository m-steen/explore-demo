import { observable, action, transaction } from 'mobx';
import { MObject } from '../model/model';
import { ViewModel } from '../model/view-model';
import { Repository } from '../repository/repository';
import Ticker from './ticker';
import { Filter } from '../../model/application';
import { History } from '../model/history';

class EditorState {
  @observable isLoading: boolean = false;
  @observable isLayouting: boolean = false;

}

class Editor {

  @observable.shallow view = new ViewModel(this);
  state = new EditorState();
  @observable selection: string[] = []; // simply a list of object id's
  ticker = new Ticker();
  history = new History(this);
  

  constructor(public repository: Repository) {
    this.history.startLogging();
  }

  isSelectionEmpty = () => this.selection.length === 0;

  @action
  clearSelection = () => {
    this.selection = [];
  }

  @action
  setSelection = (selection: string[]) => {
    this.selection = selection;
  }

  @action
  selectElement = (element: MObject) => {
    this.selection.push(element.id);
  }

  toggleSelection = (element: MObject) => {
    if (this.selection.includes(element.id)) {
      this.selection.splice(this.selection.indexOf(element.id), 1);
    } else {
      this.selection.push(element.id);
    }
  }

  @action
  initTestModel(): Promise<void> {
    this.view.clear();
    return new Promise((resolve) => {

      transaction(() => {
        const o1 = this.view.addNode('Node', 'First Element');
        const o2 = this.view.addNode('Node', 'Second Element');
        const o3 = this.view.addNode('Node', 'Third Element');
        const o4 = this.view.addNode('Node', 'Fourth Element');
        const e1 = this.view.addEdge('Relation', o1, o2, 'relation');
        this.view.addEdge('Relation', o1, o3, 'relation');
        this.view.addEdge('Relation2Relation', e1, o4, 'relation2relation');
      })

      resolve();
    });
  }

  @action
  loadModel(): Promise<void> {
    this.view.clear();
    return this.repository.loadModel(this.view);
  }

  getObjects(query: string, filter: Filter) {
    return this.repository.fetchObjects(this.view, query, filter);
  }
}

export default Editor;
