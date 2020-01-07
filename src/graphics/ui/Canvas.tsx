import React from 'react';
import { transaction } from 'mobx';
import { observer } from 'mobx-react';
import { Size } from '../model/graphics';
import { GraphicalView, ViewNode, ViewElement } from '../model/view-model';
import GraphicNode from './GraphicNode';
import GraphicLink from './GraphicLink';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { ZoomIn, ZoomOut, ZoomOutMap } from '@material-ui/icons';
import { Button, ButtonGroup } from 'react-bootstrap';

export interface ICanvas {
  view: GraphicalView;
  size: Size;
}

@observer
class Canvas extends React.Component<ICanvas> {

  render() {
    const { view } = this.props;
    const { x, y, w, h } = view;
    const viewPort = [x, y, w, h].join(' ');
    const style: React.CSSProperties = { borderStyle: 'solid' };
    return (
      <div style={{width: '100%'}}>
        <div id='Canvas' style={style} onClick={this.handleClick} onWheel={this.onWheel}>
          <DraggableCore onDrag={this.handleDrag}>
            <svg viewBox={viewPort}>
              {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} />)}
              {view.nodes.map((node) => <GraphicNode key={node.id} node={node} />)}
            </svg>
          </DraggableCore>
          <ZoomControls
            view={view}
            onPlus={this.increaseZoom}
            onMinus={this.decreaseZoom}
            onZoomToFit={view.zoomToFit} />
          <ContextMenu view={view} />
        </div>
        <p> x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p>
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.view.clearSelection();
    e.stopPropagation();
  }

  onWheel = (e: React.WheelEvent) => {
    if (e.altKey) {
      this.props.view.zoom -= e.deltaY / 2000;
    } else {
      this.props.view.origin.y -= e.deltaY / 10;
    }
  }

  increaseZoom = (view: GraphicalView) => {
    if (view.zoom >= 4) {
      view.zoom = 4;
    } else {
      view.zoom += 0.1;
    }
  }

  decreaseZoom = (view: GraphicalView) => {
    if (view.zoom <= 0.1) {
      view.zoom = 0.1;
    } else {
      view.zoom -= 0.1;
    }
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    const { view } = this.props;
    if (view.selection.length > 0) {
      view.clearSelection();
    }
    transaction(() => {
      this.props.view.origin.x -= data.deltaX / this.props.view.zoom;
      this.props.view.origin.y -= data.deltaY / this.props.view.zoom;
    })
    e.stopPropagation();
  }

}

interface IZoomControls {
  view: GraphicalView;
  onPlus: (view: GraphicalView) => void;
  onMinus: (view: GraphicalView) => void;
  onZoomToFit: () => void;
}

const ZoomControls: React.FC<IZoomControls> = (props) => {
  const canvas = document.getElementById('Canvas');
  if (!canvas) {
    return null;
  }
  const offsetLeft = canvas.offsetLeft;
  const offsetTop = canvas.offsetTop;
  return (
    <div style={{ position: "absolute", top: offsetTop, right: offsetLeft }}>
      <ZoomIn style={{ position: "absolute", top: 5, right: 20 }}
        onClick={(e) => props.onPlus(props.view)} />
      <ZoomOut style={{ position: "absolute", top: 5, right: 60 }}
        onClick={(e) => props.onMinus(props.view)} />
      <ZoomOutMap style={{ position: "absolute", top: 5, right: 100 }}
        onClick={(e) => props.onZoomToFit()} />
    </div>
  )
}

const ContextMenu: React.FC<{ view: GraphicalView }> = observer((props) => {
  const { view } = props;
  if (view.contextMenuActiveFor === null) {
    return null;
  }
  const element = view.selection.find((n: ViewElement) => view.contextMenuActiveFor === n.id);
  if (!(element instanceof ViewNode)) {
    return null;
  }
  const node = element;
  const canvas = document.getElementById('Canvas');
  const offsetLeft = canvas?.offsetLeft ?? 0;
  const offsetTop = canvas?.offsetTop ?? 0;
  const canvasWidth = canvas?.offsetWidth ?? view.w;
  const canvasHeight = canvas?.offsetHeight ?? view.h;
  const xfactor = canvasWidth / view.w;
  const yfactor = canvasHeight / view.h;
  const nodeMenu = view.nodeMenu();
  const options = nodeMenu.options.map((option) => {
    const action = () => view.selection
      .filter((n) => n instanceof ViewNode)
      .map((n) => n as ViewNode)
      .forEach((n: ViewNode) => option.action(n))
    return { label:option.label, action: action };
  })
  return (
    <ButtonGroup vertical
      style={{ position: 'absolute', left: offsetLeft + (node.x + node.width + 10 - view.x) * xfactor, top: offsetTop + (node.y - view.y) * yfactor }}>
      {options.map((option) => {
        return (
          <Button key={option.label} onClick={option.action}>{option.label}</Button>
        )
      })}
    </ButtonGroup>
  );
})

export default Canvas;
