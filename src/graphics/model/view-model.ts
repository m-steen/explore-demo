import { observable, computed } from 'mobx';
import { Color } from 'csstype';
import Ticker from '../tools/ticker';
import Editor from '../editor';
import { ForceLayout } from '../layout/force-layout';

export class ViewElement {
  id: string = '';
  label: string = '';
}

export class ViewNode extends ViewElement {
  @observable x: number = 0;
  @observable y: number = 0;
  width: number = 0;
  height: number = 0;

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
  x = 0;
  y = 0;
  w = 1000;
  h = 600;
  zoom = 1.0;
  @computed get minX() { return this.nodes.reduce((min, n) => Math.min(min, n.x), this.w/2)}
  @computed get maxX() { return this.nodes.reduce((max, n) => Math.max(max, n.x), 0)}
  @computed get minY() { return this.nodes.reduce((min, n) => Math.min(min, n.y), this.h/2)}
  @computed get maxY() { return this.nodes.reduce((max, n) => Math.max(max, n.y), 0)}

  layout = new ForceLayout(this);
  ticker = new Ticker();

  constructor(private editor: Editor) {}

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  onNodeSelect = (node: ViewNode) => {
    this.layout.stop();
    this.selection = node;
    console.log('Selected Node ' + node.label)
  }

  onEdgeSelect = (edge: ViewEdge) => {
    this.layout.stop();
    this.selection = edge;
    console.log('Selected Edge ' + edge.label)
  }

}
