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
      if (color === undefined) { return ''; }
      return color;
    }

    this.view.nodeMenu = (node: ViewNode) => {
      const menu = new Menu();
      const expandOutgoingAction = () => this.api.getRelationsFrom(node, this.view).then(() => this.view.layout.apply());
      const expandOutgoing = new MenuOption('Expand outgoing', expandOutgoingAction);
      menu.options.push(expandOutgoing);
      const expandIncomingAction = () => this.api.getRelationsTo(node, this.view).then(() => this.view.layout.apply());
      const expandIncoming = new MenuOption('Expand incoming', expandIncomingAction);
      menu.options.push(expandIncoming);
      const removeAction = () => {
        this.view.edges.filter((edge) => edge.source === node || edge.target === node)
          .forEach((edge) => this.view.edges.splice(this.view.edges.indexOf(edge), 1));
        this.view.nodes.splice(this.view.nodes.indexOf(node), 1);
      }
      const removeNode = new MenuOption('Remove', removeAction);
      menu.options.push(removeNode);
      return menu;
    }
  }
}

export default Application;