import React from 'react';
import { DraggableEventHandler, DraggableCore } from 'react-draggable';
import { transaction } from 'mobx';
import { observer } from 'mobx-react';
import * as Symbols from '../../../graphics/symbols';
import { ViewNode } from '../../model/view-model';

export interface DiagramNodeProps {
  node: ViewNode;
}

@observer
class DiagramNode extends React.Component<DiagramNodeProps> {

  render() {
    const { node } = this.props;
    const labelPos = { x: node.x + node.width / 2, y: node.y + node.height + 15 };
    const textStyle: React.CSSProperties = { fontSize: 10, textAlign: "center" };
    return (
      <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag}>
        <g onClick={this.handleClick} onContextMenu={this.handleContextMenu}>
          <GraphicShape node={node} />
          <text x={labelPos.x} y={labelPos.y} style={textStyle}>{node.label}</text>
        </g>
      </DraggableCore>
    );
  }

  handleClick = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    const { node } = this.props;
    if (!e.shiftKey) {
      node.getView().getEditor().clearSelection();
      node.getView().getEditor().selectElement(node);
    } else {
      node.getView().getEditor().toggleSelection(node);
    }
    e.stopPropagation();
  }

  handleContextMenu = (e: React.MouseEvent<SVGAElement, MouseEvent>) => {
    e.preventDefault();
    const { node } = this.props;
    const view = node.getView();
    const editor = view.getEditor();
    if (node.isSelected) {
      view.layout.stop();
      if (view.contextMenuActiveFor === null) {
        view.contextMenuActiveFor = node.id;
      } else {
        view.contextMenuActiveFor = null;
      }
    } else {
      editor.clearSelection();
      editor.selectElement(node);
      view.contextMenuActiveFor = node.id;
    }
    e.stopPropagation();
  }

  handleDragStart: DraggableEventHandler = (e, data) => {
    e.stopPropagation();
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    const { node } = this.props;
    transaction(() => {
      node.x += data.deltaX / (node.getView().zoomFactor || 1);
      node.y += data.deltaY / (node.getView().zoomFactor || 1);
    })
    e.stopPropagation();
  }
}

const GraphicShape: React.FC<{ node: ViewNode }> = observer((props) => {
  const { node } = props;
  const fillColor = node.getView().nodeColor(node);
  const strokeColor = node.isPrimarySelection ? 'chartreuse' : node.isSelected ? 'blue' : 'grey';
  const style: React.CSSProperties = { stroke: strokeColor, strokeWidth: 2, fill: fillColor };
  if (node.shape) {
    const Symbol: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = Reflect.get(Symbols, node.shape);
    if (Symbol) return <Symbol key={'shape' + node.id} x={node.x} y={node.y} width={node.width} height={node.height} style={style} />;
  }
  const hmargin = 0.1 * node.width;
  const vmargin = 0.1 * node.height;
  const w = node.width - 2 * hmargin;
  const h = node.height - 2 * vmargin;
  return <rect key={'shape' + node.id} x={node.x + hmargin} y={node.y + vmargin} width={w} height={h} style={style} />
})

export default DiagramNode;
