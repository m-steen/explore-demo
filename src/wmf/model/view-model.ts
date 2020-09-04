import { observable, transaction, computed, action } from 'mobx';
import { Color } from 'csstype';
import { MModel, MObject, MRelation } from "./model";
import { Position, Size } from '../graphics/graphics';
import Editor from '../editor/editor';
import { ForceLayout } from '../graphics/layout/force-layout';
import { Menu } from '../editor/menu';
import { serializable, list, reference, object, serialize } from "serializr";
import Property, { IProperty } from './properties';

export class ViewNode extends MObject {

  @serializable
  @observable x: number = Math.random() * 800;
  @serializable
  @observable y: number = Math.random() * 600;
  @serializable
  @observable width: number = 40;
  @serializable
  @observable height: number = 30;
  @serializable
  @observable shape: string = '';

  @computed get label(): string { return this._name; };

  @computed get isPrimarySelection() {
    const selection = this.view.getEditor().selection;
    return selection.length > 0 && selection[0] === this.id;
  }

  @computed get isSelected() {
    return this.view.getEditor().selection.includes(this.id);
  }

  constructor(readonly view: ViewModel, type: string, name?: string, id?: string) {
    super(type, name, id);
    this.shape = this._type;
  }

  delete = () => {
    if (this.view.nodes.includes(this)) {
      this.view.edges.filter((edge) => edge.source === this || edge.target === this)
        .forEach((edge) => edge.delete());
      if (this.isSelected) {
        this.view.getEditor().toggleSelection(this);
      }
      this.view.nodes.splice(this.view.nodes.indexOf(this), 1);
    }
  }

  @action
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  @action
  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

}

export class ViewEdge extends ViewNode {

  @serializable(reference(ViewNode))
  source: ViewNode;
  @serializable(reference(ViewNode))
  target: ViewNode;

  @computed get label(): string { return this._name; };

  @computed get isPrimarySelection() {
    const selection = this.view.getEditor().selection;
    return selection.length > 0 && selection[0] === this.id;
  }

  @computed get isSelected() {
    return this.view.getEditor().selection.includes(this.id);
  }

  constructor(readonly view: ViewModel, type: string, source: ViewNode, target: ViewNode, name?: string, id?: string) {
    super(view, type, name, id);
    this.source = source;
    this.target = target;
  }

  delete = () => {
    if (this.view.edges.includes(this)) {
      if (this.isSelected) {
        this.view.getEditor().toggleSelection(this);
      }
      this.view.edges.splice(this.view.edges.indexOf(this), 1);
    }
  }
}

export class ViewModel extends MModel {

  @serializable(list(object(ViewNode)))
  @computed get nodes(): ViewNode[] { return this.objects as ViewNode[]; }
  @serializable(list(object(ViewEdge)))
  @computed get edges(): ViewEdge[] { return this.relations as ViewEdge[]; }

  @serializable(object(Position))
  @observable origin = new Position(0, 0);
  @serializable(object(Size))
  @observable size = new Size(1140, 1140 / 4 * 3);

  @serializable
  @observable x = this.origin.x;
  @serializable
  @observable y = this.origin.y;
  @serializable
  @observable w = this.size.width;
  @computed get h() { return this.w / 4 * 3; }

  @computed get viewport() { return [ this.x, this.y, this.w, this.h ]; }
  @computed get zoomFactor() { return this.size.width / this.w }

  @computed get minX() { return this.nodes.reduce((min, n) => Math.min(min, n.x), this.w/2)}
  @computed get maxX() { return this.nodes.reduce((max, n) => Math.max(max, n.x + n.width), 0)}
  @computed get minY() { return this.nodes.reduce((min, n) => Math.min(min, n.y), this.h/2)}
  @computed get maxY() { return this.nodes.reduce((max, n) => Math.max(max, n.y + n.height), 0)}

  layout = new ForceLayout(this);

  @observable contextMenuActiveFor: string | null = null;

  getEditor(): Editor {
    return this.editor;
  }

  addNode(type: string, name: string, id?: string): ViewNode {
    const newNode = new ViewNode(this, type, name, id);
    this.nodes.push(newNode);
    return newNode;
  }

  addEdge(type: string, source: ViewNode, target: ViewNode, name?: string, id?: string): ViewEdge {
    return transaction(() => {
      if (source instanceof ViewEdge) {
        // source is an edge itself: introduce a dummy node
        const dummyNode = new DummyNode(this, source);
        this.nodes.push(dummyNode);
        // replace the original edge with two segments to and from the dummy node
        const segment1 = new EdgeSegment(this, source, source.source, dummyNode);
        const segment2 = new EdgeSegment(this, source, dummyNode, source.target);
        this.edges.push(segment1);
        this.edges.push(segment2);
        this.edges.splice(this.edges.indexOf(source), 1);
        source = dummyNode;
      }
      if (target instanceof ViewEdge) {
        // target is an edge itself: introduce a dummy node
        const dummyNode = new DummyNode(this, target);
        this.nodes.push(dummyNode);
        // replace the original edge with two segments to and from the dummy node
        const segment1 = new EdgeSegment(this, target, target.source, dummyNode);
        const segment2 = new EdgeSegment(this, target, dummyNode, target.target);
        this.edges.push(segment1);
        this.edges.push(segment2);
        this.edges.splice(this.edges.indexOf(target), 1);
        target = dummyNode;
      }
      const newEdge = new ViewEdge(this, type, source, target, name, id);
      this.edges.push(newEdge);
      return newEdge;
    })
  }

  @action
  setPosition(x: number, y: number) {
    this.origin.x = x;
    this.origin.y = y;
  }

  @action
  setSize(width: number, height: number) {
    this.size.width = width;
    this.size.height = height;
  }

  pan = (deltaX: number, deltaY: number) => {
    transaction(() => {
      this.x -= deltaX / this.zoomFactor;
      this.y -= deltaY / this.zoomFactor;
    })
  }

  zoom = (zoomBy: number) => {
    if (zoomBy < 0 || this.w > 100) {
      transaction(() => {
        this.w -= zoomBy / this.zoomFactor;
        this.x += zoomBy / 2 / this.zoomFactor;
        this.y += zoomBy / 2 / this.zoomFactor;
      })
    }
  }

  zoomTo = (x: number, y: number, zoomBy: number) => {
    if (zoomBy < 0 || this.w > 100) {
      this.w -= zoomBy / this.zoomFactor;
      this.x += (x - this.x) / this.w * zoomBy / this.zoomFactor;
      this.y += (y - this.y) / this.h / 4 * 3 * zoomBy / this.zoomFactor;
    }
  }

  zoomToFit = () => {
    if (this.maxX - this.minX > 0) {
      transaction(() => {
        this.x = this.minX - 20;
        this.y = this.minY - 20;
        this.w = Math.max(this.maxX - this.minX, (this.maxY - this.minY) * 4 / 3) + 40;
      })
    }
  }

  nodeColor: (node: ViewNode) => Color = (node: ViewNode) => 'lightgrey';

  nodeMenu: () => Menu<ViewNode> = () => new Menu();

  serialize = () => {
    return serialize(ViewModel, this);
  }

  deserialize = (json: any) => {
    const newView = new ViewModel(this.editor);
    const nodes = json.nodes;
    nodes.forEach((node: any) => {
      const newNode = newView.addNode(node.type, node.name, node.id);
      [ newNode.x, newNode.y, newNode.width, newNode.height, newNode._domain, newNode.shape ] = [ node.x, node.y, node.width, node.height, node._domain, node.shape ];
      if (node.properties) {
        const properties: IProperty[] = Object.values(node.properties).filter((prop: any) => Property.isProperty(prop)).map((prop) => prop as IProperty);
        newNode.addProperties(properties);
      }
    });
    const edges = json.edges;
    edges.forEach((edge: any) => {
      const source = newView.nodes.find((n) => edge.source === n.id);
      const target = newView.nodes.find((n) => edge.target === n.id);
      if (source && target) {
        newView.addEdge(edge.type, source, target, edge.name, edge.id);
      } else {
        console.log('Source or target not found for: ', edge, source, target)
      }
    });
    newView.origin = new Position(json.origin.x, json.origin.y);
    newView.size = new Size(json.size.width, json.size.height);
    [ newView.x, newView.y, newView.w ] = [ json.x, json.y, json.w ];
    newView.nodeColor = this.nodeColor;
    newView.nodeMenu = this.nodeMenu;
    this.editor.view = newView;
  }
}

export class DummyNode extends ViewNode {

  constructor(readonly view: ViewModel, edge: ViewEdge) {
    super(view, edge._type, edge._name, edge.id);
    this.shape = 'circle';
    this.setSize(20, 20);
  }
}

export class EdgeSegment extends ViewEdge {

  constructor(readonly view: ViewModel, protected edge: MRelation, source: ViewNode, target: ViewNode) {
    super(view, edge._type, source, target, edge._name, edge.id);
    this._name = '';
  }
}
