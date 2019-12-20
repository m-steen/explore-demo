import { observable } from 'mobx';
import Api from '../backend/api';
import { GraphicalView } from '../graphics/model/view-model';

class EditorState {
  @observable isLoading: boolean = false;
  @observable isLayouting: boolean = false;

}

class Editor {
  state = new EditorState();
  api = new Api();
  view = new GraphicalView(this);

}

export default Editor;
