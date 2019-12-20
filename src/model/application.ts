import { observable } from 'mobx';
import Editor from '../graphics/editor';
import { ViewNode } from '../graphics/model/view-model';

const colorScheme: Map<string, string> = new Map([
  ['Business', '#FAF087'],
  ['Application', '#B8E7FC'],
  ['Technology', '#D6F8B8'],
  ['Strategy', '#FFC685'],
  ['Motivation', '#D7CFFF'],
  ['IM', '#FFBDDC'],
  ['None', '#D6F8B8'],
  ['', '#D6F8B8'],
]);

class Application extends Editor {
  @observable title: string = '';
  @observable query: string = '';

  constructor(title: string = '') {
    super();
    this.title = title;

    this.view.nodeColor = (node: ViewNode) => {
      const color = colorScheme.get(node.layer);
      if (color === undefined) { return ''; }
      return color;
    }
  }

}

export default Application;