import React from 'react';
import { ViewNode, ViewEdge, GraphicalView } from '../model/view-model';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

export interface IGraphicLink {
  edge: ViewEdge;
  view: GraphicalView;
}

@observer
class GraphicLink extends React.Component<IGraphicLink> {

  render() {
    const { from, to } = this.props.edge;
    const strokeColor = this.isSelected ? 'green' : 'blue';
    const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2 };
    let [x1, y1] = [0, 0];
    if (from instanceof ViewNode) {
      [x1, y1] = [from.x + from.width / 2, from.y + from.height / 2]
    }
    let [x2, y2] = [0, 0];
    if (to instanceof ViewNode) {
      [x2, y2] = [to.x + to.width / 2, to.y + to.height / 2]
    }
    return <path style={style} onClick={this.handleClick}
      d={`M${x1} ${y1} L${x2} ${y2}`}
    />
  }

  @computed get isSelected() {
    return this.props.view.selection && this.props.view.selection.id === this.props.edge.id;
  }

  handleClick = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
    this.props.view.onEdgeSelect(this.props.edge);
    e.stopPropagation();
  }

}

export default GraphicLink;
