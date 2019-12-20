import React from 'react';
import { DraggableEventHandler, DraggableCore } from 'react-draggable';
import { computed, transaction } from 'mobx';
import { ViewNode, GraphicalView } from '../model/view-model';
import { observer } from 'mobx-react';

export interface IGraphicNode {
  node: ViewNode;
  view: GraphicalView;
  zoom: number;
}

@observer
class GraphicNode extends React.Component<IGraphicNode> {

  render() {
    const { node, view } = this.props;
    const fillColor = view.nodeColor(node);
    const strokeColor = this.isSelected ? 'green' : 'gray';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2, fill: fillColor };
    const labelPos = { x: node.x + node.width / 2, y: node.y + node.height + 15 };
    const textStyle: React.CSSProperties = { fontSize: 12, textAlign: "center" };
    return (
      <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag}>
        <g onClick={this.handleClick} onContextMenu={this.handleContextMenu}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} style={style} />
          <text x={labelPos.x} y={labelPos.y} style={textStyle}>{node.label}</text>
        </g>
      </DraggableCore>
    );
  }

  @computed get isSelected() {
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
      this.props.node.x += data.deltaX / this.props.zoom;
      this.props.node.y += data.deltaY / this.props.zoom;
    })
    e.stopPropagation();
  }
}

export default GraphicNode;
