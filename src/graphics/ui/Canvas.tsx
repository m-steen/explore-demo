import React from 'react';
import { transaction } from 'mobx';
import { observer } from 'mobx-react';
import { Size } from '../model/graphics';
import { GraphicalView, ViewNode } from '../model/view-model';
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
    const pos: React.CSSProperties = { position: "absolute" };
    const viewPort = [x, y, w, h].join(' ');
    const style: React.CSSProperties = { ...pos, ...{ borderStyle: 'solid' } };
    return (
      <div>
        <div id='Canvas' style={style} onClick={this.handleClick} onWheel={this.onWheel}>
          <DraggableCore onDrag={this.handleDrag}>
            <svg width={'80vw'} height={'80vh'} viewBox={viewPort}>
              {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} view={view} />)}
              {view.nodes.map((node) => <GraphicNode key={node.id} node={node} view={view} />)}
            </svg>
          </DraggableCore>
          <ZoomControls
            view={view}
            onPlus={this.increaseZoom}
            onMinus={this.decreaseZoom}
            onZoomToFit={view.zoomToFit} />
          <ContextMenu view={view} />
        </div>
        <p>x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p>
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.view.selection = null;
    this.props.view.showContextMenu = false;
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
    if (view.selection) {
      view.selection = null;
      view.showContextMenu = false;
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
  return (
    <div style={{ position: "absolute", top: 0, right: 0 }}>
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
  const node = view.selection;
  const canvas = document.getElementById('Canvas');
  const canvasWidth = canvas?.offsetWidth ?? view.w;
  const canvasHeight = canvas?.offsetHeight ?? view.h;
  const xfactor = canvasWidth / view.w;
  const yfactor = canvasHeight / view.h;
  if (node && view.showContextMenu && node instanceof ViewNode) {
    const menu = view.nodeMenu(node);
    return (
      <ButtonGroup vertical style={{ position: 'absolute', left: (node.x + node.width + 10 - view.x) * xfactor, top: (node.y - view.y) * yfactor }}>
        {menu.options.map((option) => {
          return (
            <Button key={option.label} onClick={option.action}>{option.label}</Button>
          )
        })}
      </ButtonGroup>
    );
  } else {
    return null;
  }
})

export default Canvas;
