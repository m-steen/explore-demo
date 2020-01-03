import React from 'react';
import { DraggableEventHandler, DraggableCore } from 'react-draggable';
import { transaction } from 'mobx';
import { ViewNode, GraphicalView } from '../model/view-model';
import { observer } from 'mobx-react';
import * as Symbols from '../symbols';

export interface IGraphicNode {
  node: ViewNode;
  view: GraphicalView;
}

@observer
class GraphicNode extends React.Component<IGraphicNode> {

  render() {
    const { node, view } = this.props;
    const fillColor = view.nodeColor(node);
    const strokeColor = this.isSelected() ? 'chartreuse' : 'grey';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2, fill: fillColor };
    const labelPos = { x: node.x + node.width / 2, y: node.y + node.height + 15 };
    const textStyle: React.CSSProperties = { fontSize: 10, textAlign: "center" };
    return (
      <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag}>
        <g onClick={this.handleClick} onContextMenu={this.handleContextMenu}>
          <GraphicShape node={node} style={style} />
          <text x={labelPos.x} y={labelPos.y} style={textStyle}>{node.label}</text>
        </g>
      </DraggableCore>
    );
  }

  isSelected = () => {
    return this.props.view.selection && this.props.view.selection.id === this.props.node.id;
  }

  handleClick = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    this.props.view.onNodeSelect(this.props.node);
    e.stopPropagation();
  }

  handleContextMenu = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    e.preventDefault();
    this.props.view.onNodeSelect(this.props.node);
    this.props.view.onNodeContextMenu(this.props.node);
    e.stopPropagation();
  }

  handleDragStart: DraggableEventHandler = (e, data) => {
    this.props.view.onNodeSelect(this.props.node);
    e.stopPropagation();
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    transaction(() => {
      this.props.node.x += data.deltaX / this.props.view.zoom;
      this.props.node.y += data.deltaY / this.props.view.zoom;
    })
    e.stopPropagation();
  }
}

const GraphicShape: React.FC<{ node: ViewNode, style: React.CSSProperties }> = (props) => {
  const { node } = props;
  if (node.shape) {
    const Symbol: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = Reflect.get(Symbols, node.shape);
    if (Symbol) return <Symbol key={'shape'+node.id} x={node.x} y={node.y} width={node.width} height={node.height} style={props.style} />;
  }
  const hmargin = 0.1 * node.width;
  const vmargin = 0.1 * node.height;
  const w = node.width - 2 * hmargin;
  const h = node.height - 2 * vmargin;
  return <rect key={'shape'+node.id} x={node.x + hmargin} y={node.y + vmargin} width={w} height={h} style={props.style} />
}

export default GraphicNode;
