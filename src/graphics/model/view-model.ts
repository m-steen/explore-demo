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
}

export class ViewNode extends ViewElement {
  @observable x: number = 0;
  @observable y: number = 0;
  width: number = 0;
  height: number = 0;
  layer: string = '';
  shape: string = '';

  onSelect: (e: any) => void = (e) => {};
}

export class ViewEdge extends ViewElement {
  source: ViewNode;
  target: ViewNode;

  constructor(source: ViewNode, target: ViewNode) {
    super();
    this.source = source;
    this.target = target;
  }
}

export class GraphicalView {
  @observable nodes: ViewNode[] = [];
  @observable edges: ViewEdge[] = [];
  @observable selection: ViewElement | null = null;
  @observable showContextMenu = false;
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

  nodeMenu: (node: ViewNode) => Menu = (node: ViewNode) => new Menu();

  onNodeSelect = (node: ViewNode) => {
    this.layout.stop();
    this.showContextMenu = false;
    this.selection = node;
    console.log('Selected Node ' + node.label)
  }


  onEdgeSelect = (edge: ViewEdge) => {
    this.layout.stop();
    this.selection = edge;
    this.showContextMenu = false;
    console.log('Selected Edge ' + edge.label)
  }

  zoomToFit = () => {
    const desiredWidth = this.maxX - this.minX;
    const desiredHeight = this.maxY - this.minY;
    const desiredZoom = 0.9 * Math.min(this.size.width / desiredWidth, this.size.height / desiredHeight);
    transaction(() => {
      this.zoom = desiredZoom;
      this.origin = { x: this.minX - (this.size.width - this.size.width / desiredZoom) / 2, y: this.minY - (this.size.height - this.size.height / desiredZoom) / 2 };
    })
  }

}
