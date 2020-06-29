import React from 'react';
import { ViewEdge } from '../model/view-model';
import { observer } from 'mobx-react';
import { transaction } from 'mobx';

export interface IGraphicLink {
  edge: ViewEdge;
}

@observer
class GraphicLink extends React.Component<IGraphicLink> {

  render() {
    const { edge } = this.props;
    const { source, target } = edge;
    const strokeColor = this.isPrimarySelection() ? 'chartreuse' : this.isSelected() ? 'blue' : 'lightgrey';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2 };
    let [x1, y1] = [source.x + source.width / 2, source.y + source.height / 2]
    let [x2, y2] = [target.x + target.width / 2, target.y + target.height / 2]
    const labelPos = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    const textStyle: React.CSSProperties = { fontSize: 10, textAlign: "center" };
    return <g onClick={this.handleClick} >
      <line className='link' style={style} x1={x1} y1={y1} x2={x2} y2={y2} />
      <text x={labelPos.x} y={labelPos.y} style={textStyle}>{this.props.edge.label}</text>
      </g>
  }

  isPrimarySelection = () => {
    const { edge } = this.props;
    const selection = edge.view?.selection || [];
    return selection.length > 0 && selection[0] === edge;
  }

  isSelected = () => {
    const { edge } = this.props;
    return edge.view?.selection.includes(edge) || false;
  }

  handleClick = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    const { edge } = this.props;
    if (!e.shiftKey) {
      transaction(() => {
        edge.view?.clearSelection();
        edge.view?.selectElement(edge);
        });
    } else {
      edge.view?.toggleSelection(edge);
    }
    e.stopPropagation();
  }

}

export default GraphicLink;
