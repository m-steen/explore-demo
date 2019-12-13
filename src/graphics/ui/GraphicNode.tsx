import React from 'react';
import { DraggableEventHandler, DraggableCore } from 'react-draggable';
import { computed, transaction } from 'mobx';
import { ViewNode, GraphicalView } from '../model/view-model';
import { observer } from 'mobx-react';

export interface IGraphicNode {
  node: ViewNode;
  view: GraphicalView;
}

@observer
class GraphicNode extends React.Component<IGraphicNode> {

  render() {
    const { node, view } = this.props;
    const fillColor = view.nodeColor(node);
    const strokeColor = this.isSelected ? 'green' : 'gray';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2, fill: fillColor };
    return (
      <DraggableCore onDrag={this.handleDrag}>
        <g onClick={this.handleClick}>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} style={style} />
          <text x={node.x + 10} y={node.y + 15}>{node.label}</text>
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

  handleDrag: DraggableEventHandler = (e, data) => {
    transaction(() => {
      this.props.node.x += data.deltaX;
      this.props.node.y += data.deltaY;
    })
  }
}

export default GraphicNode;
