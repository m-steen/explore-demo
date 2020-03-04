import { observable, computed, action, transaction } from 'mobx';
import { Color } from 'csstype';
import Ticker from '../tools/ticker';
import Editor from '../editor';
import { ForceLayout } from '../layout/force-layout';
import { Menu } from './menu';

export class ViewElement {
  id: string = '';
  label: string = '';
  type: string = '';
  view: GraphicalView;

  constructor(view: GraphicalView) {
    this.view = view;
  }

  getProperty = (name: string) => {
    const property = Object.entries(this).find(([key, value]) => name === key);
    if (property) {
      const type = typeof(property[1]);
      if (type !== 'object' && type !== 'function') {
        return property[1];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

}

export class ViewNode extends ViewElement {
  @observable x: number = 0;
  @observable y: number = 0;
  width: number = 0;
  height: number = 0;
  layer: string = '';
  shape: string = '';

  delete = () => {
    if (this.view.nodes.includes(this)) {
      this.view.edges.filter((edge) => edge.source === this || edge.target === this)
        .forEach((edge) => edge.delete());
      console.log('deleting node: ' + this.label)
      if (this.view.selection.includes(this)) {
        this.view.selection.splice(this.view.selection.indexOf(this), 1);
      }
      this.view.nodes.splice(this.view.nodes.indexOf(this), 1);
    }
  }

  @computed get isPrimarySelection() {
    const { selection } = this.view;
    return selection.length > 0 && selection[0] === this;
  }

  @computed get isSelected() {
    return this.view.selection.includes(this);
  }

}

export class ViewEdge extends ViewElement {
  source: ViewNode;
  target: ViewNode;

  constructor(view: GraphicalView, source: ViewNode, target: ViewNode) {
    super(view);
    this.source = source;
    this.target = target;
  }

  delete = () => {
    if (this.view.edges.includes(this)) {
      if (this.view.selection.includes(this)) {
        this.view.selection.splice(this.view.selection.indexOf(this), 1);
      }
      this.view.edges.splice(this.view.edges.indexOf(this), 1);
    }
  }
}

export class GraphicalView {
  @observable.shallow nodes: ViewNode[] = [];
  @observable.shallow edges: ViewEdge[] = [];

  @observable.shallow selection: ViewElement[] = [];
  @observable contextMenuActiveFor: string | null = null;

  @observable absoluteX = 0;
  @observable absoluteY = 0;
  @observable absoluteW = 1140;
  @observable absoluteH = this.absoluteW / 4 * 3;
  @observable x = this.absoluteX;
  @observable y = this.absoluteY;
  @observable w = this.absoluteW;
  @computed get h() { return this.w / 4 * 3 }
  @computed get zoom() { return this.absoluteW / this.w }

  @computed get minX() { return this.nodes.reduce((min, n) => Math.min(min, n.x), this.w/2)}
  @computed get maxX() { return this.nodes.reduce((max, n) => Math.max(max, n.x + n.width), 0)}
  @computed get minY() { return this.nodes.reduce((min, n) => Math.min(min, n.y), this.h/2)}
  @computed get maxY() { return this.nodes.reduce((max, n) => Math.max(max, n.y + n.height), 0)}

  layout = new ForceLayout(this);
  ticker = new Ticker();

  constructor(private editor: Editor) {}

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  nodeMenu: () => Menu<ViewNode> = () => new Menu();

  @action
  clearSelection = () => {
    this.contextMenuActiveFor = null;
    if (this.selection.length > 0) {
      this.selection = [];
    }
  }

  clear = () => {
    transaction(() => {
      this.layout.stop();
      this.clearSelection();
      if (this.edges.length > 0) {
        this.edges = [];
      }
      if (this.nodes.length > 0) {
        this.nodes = [];
      }
      this.x = 0;
      this.y = 0;
      this.w = 1140;
    })
  }

  @action
  selectElement = (element: ViewElement) => {
    this.selection.push(element);
    console.log('Select Element: ' + element.label)
  }

  toggleSelection = (element: ViewElement) => {
    console.log('Toggle Selection for: ' + element.label)
    if (this.selection.includes(element)) {
      this.selection.splice(this.selection.indexOf(element), 1);
    } else {
      this.selection.push(element);
    }
  }

  zoomToFit = () => {
    if (this.maxX - this.minX > 0) {
      this.x = this.minX - 20;
      this.y = this.minY - 20;
      this.w = Math.max(this.maxX - this.minX, (this.maxY - this.minY) * 4 / 3) + 40;
    }
  }

}
