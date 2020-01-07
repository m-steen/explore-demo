import { observable, computed, transaction } from 'mobx';
import { Color } from 'csstype';
import Ticker from '../tools/ticker';
import Editor from '../editor';
import { ForceLayout } from '../layout/force-layout';
import { Position, Size } from './graphics';
import { Menu } from './menu';

export class ViewElement {
  id: string = '';
  label: string = '';
  view: GraphicalView;

  constructor(view: GraphicalView) {
    this.view = view;
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
        .forEach((edge) => this.view.edges.splice(this.view.edges.indexOf(edge), 1));
      console.log('deleting node: ' + this.label)
      this.view.nodes.splice(this.view.nodes.indexOf(this), 1);
    }
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
      this.view.edges.splice(this.view.edges.indexOf(this), 1);
    }
  }
}

export class GraphicalView {
  @observable nodes: ViewNode[] = [];
  @observable edges: ViewEdge[] = [];

  @observable selection: ViewElement[] = [];
  @observable contextMenuActiveFor: string | null = null;

  @observable origin: Position = { x: 0, y: 0 };
  size: Size = { width: 1000, height: 600 };
  @observable zoom = 1.0;

  @computed get x() { return this.origin.x + (this.size.width - this.w) / 2 };
  @computed get y() { return this.origin.y + (this.size.height - this.h) / 2 };
  @computed get w() { return this.size.width / this.zoom }
  @computed get h() { return this.size.height / this.zoom }
  @computed get minX() { return this.nodes.reduce((min, n) => Math.min(min, n.x), this.w/2)}
  @computed get maxX() { return this.nodes.reduce((max, n) => Math.max(max, n.x), 0)}
  @computed get minY() { return this.nodes.reduce((min, n) => Math.min(min, n.y), this.h/2)}
  @computed get maxY() { return this.nodes.reduce((max, n) => Math.max(max, n.y), 0)}

  layout = new ForceLayout(this);
  ticker = new Ticker();

  constructor(private editor: Editor) {}

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  nodeMenu: () => Menu<ViewNode> = () => new Menu();

  clearSelection = () => {
    this.contextMenuActiveFor = null;
    this.selection = [];
  }

  clear = () => {
    this.layout.stop();
    this.clearSelection();
    this.edges = [];
    this.nodes = [];
    this.origin = { x: 0, y: 0 };
    this.zoom = 1.0;
  }

  selectElement = (element: ViewElement) => {
    this.selection.push(element);
    console.log('Selected Element ' + element.label)
  }

  toggleSelection = (element: ViewElement) => {
    if (this.selection.includes(element)) {
      this.selection.splice(this.selection.indexOf(element), 1);
    } else {
      this.selection.push(element);
      console.log('Selected Element ' + element.label)
    }
  }

  zoomToFit = () => {
    const desiredWidth = this.maxX - this.minX;
    const desiredHeight = this.maxY - this.minY;
    if (desiredWidth > 0 && desiredHeight > 0) {
      const desiredZoom = 0.9 * Math.min(this.size.width / desiredWidth, this.size.height / desiredHeight);
      transaction(() => {
        this.zoom = desiredZoom;
        this.origin = { x: this.minX - (this.size.width - this.size.width / desiredZoom) / 2, y: this.minY - (this.size.height - this.size.height / desiredZoom) / 2 };
      })
    }
  }

}
