import { observable } from 'mobx';
import { Color } from 'csstype';

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
  from: ViewElement;
  to: ViewElement;

  constructor(from: ViewElement, to: ViewElement) {
    super();
    this.from = from;
    this.to = to;
  }
}

export class GraphicalView {
  @observable nodes: ViewNode[] = [];
  edges: ViewEdge[] = [];
  @observable selection: ViewElement | null = null;

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  onNodeSelect = (node: ViewNode) => {
    this.selection = node;
    console.log('Selected Node ' + node.label)
  }

  onEdgeSelect = (edge: ViewEdge) => {
    this.selection = edge;
    console.log('Selected Edge ' + edge.label)
  }

}
