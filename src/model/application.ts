import { observable } from 'mobx';
import Editor from '../graphics/editor';
import { ViewNode } from '../graphics/model/view-model';
import { Menu, MenuOption } from '../graphics/model/menu';

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
      if (color === undefined) { return 'white'; }
      return color;
    }

    this.view.nodeMenu = () => {
      const menu = new Menu<ViewNode>();
      const expandOutgoingAction = (node: ViewNode) => this.api.getRelationsFrom(node, this.view).then(() => this.view.layout.apply());
      const expandOutgoing = new MenuOption('Expand outgoing relations', expandOutgoingAction);
      menu.options.push(expandOutgoing);
      const expandIncomingAction = (node: ViewNode) => this.api.getRelationsTo(node, this.view).then(() => this.view.layout.apply());
      const expandIncoming = new MenuOption('Expand incoming relations', expandIncomingAction);
      menu.options.push(expandIncoming);
      const expandAllAction = (node: ViewNode) => this.api.getRelationsFrom(node, this.view).then(() => this.api.getRelationsTo(node, this.view)).then(() => this.view.layout.apply());
      const expandAll = new MenuOption('Expand all relations', expandAllAction);
      menu.options.push(expandAll);
      const removeAction = (node: ViewNode) => node.delete();
      const removeNode = new MenuOption('Remove', removeAction);
      menu.options.push(removeNode);
      return menu;
    }
  }
}

export default Application;