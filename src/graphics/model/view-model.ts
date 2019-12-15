import { observable } from 'mobx';
import { Color } from 'csstype';
import { TreeLayout } from '../layout/tree-layout';
import Ticker from '../tools/ticker';
import Editor from '../editor';

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
  @observable edges: ViewEdge[] = [];
  @observable selection: ViewElement | null = null;
  layout = new TreeLayout(this);
  ticker = new Ticker();

  constructor(private editor: Editor) {}

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  onNodeSelect = (node: ViewNode) => {
    this.selection = node;
    console.log('Selected Node ' + node.label)
  }

  onEdgeSelect = (edge: ViewEdge) => {
    this.selection = edge;
    console.log('Selected Edge ' + edge.label)
  }

  // applyLayout = () => {
  //   this.startLayout();
  //   return when(() => !this.editor.state.isLayouting);
  
  // }

  // startLayout = () => {
  //   this.ticker.registerAction('layout', this.layout.updateLayout);
  //   this.editor.state.isLayouting = true;

  // }

  // stopLayout = () => {
  //   this.ticker.unregisterAction('layout');
  //   this.editor.state.isLayouting = false;

  // }
}
