import React from 'react';
import { ViewEdge, GraphicalView } from '../model/view-model';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

export interface IGraphicLink {
  edge: ViewEdge;
  view: GraphicalView;
}

@observer
class GraphicLink extends React.Component<IGraphicLink> {

  render() {
    const { source, target } = this.props.edge;
    const strokeColor = this.isSelected ? 'green' : 'blue';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2 };
    let [x1, y1] = [source.x + source.width / 2, source.y + source.height / 2]
    let [x2, y2] = [target.x + target.width / 2, target.y + target.height / 2]
    const labelPos = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    const textStyle: React.CSSProperties = { fontSize: 12, textAlign: "center" };
    return <g onClick={this.handleClick} >
      <line className='link' key={this.props.edge.id} style={style} x1={x1} y1={y1} x2={x2} y2={y2} />
      <text x={labelPos.x} y={labelPos.y} style={textStyle}>{this.props.edge.label}</text>
      </g>
  }
    
  @computed get isSelected() {
    return this.props.view.selection && this.props.view.selection.id === this.props.edge.id;
  }

  handleClick = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    this.props.view.onEdgeSelect(this.props.edge);
    e.stopPropagation();
  }

}

export default GraphicLink;
