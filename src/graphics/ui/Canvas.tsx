import React from 'react';
import { transaction, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Position } from '../model/graphics';
import { GraphicalView, ViewNode, ViewElement } from '../model/view-model';
import GraphicNode from './GraphicNode';
import GraphicLink from './GraphicLink';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { ZoomIn, ZoomOut, ZoomOutMap } from '@material-ui/icons';
import { Button, ButtonGroup } from 'react-bootstrap';

export interface ICanvas {
  view: GraphicalView;
}

@observer
class Canvas extends React.Component<ICanvas> {
  canvas: HTMLDivElement | null = null; 
  @observable lassoToolActive = false;
  @observable lassoToolOrigin = { x: 0, y: 0 };
  @observable lassoToolMaxim = { x: 0, y: 0 };

  render() {
    const { view } = this.props;
    const { x, y, w, h } = view;
    const viewPort = [x, y, w, h].join(' ');
    const style: React.CSSProperties = { borderStyle: 'solid' };
    return (
      <div style={{ width: '100%' }}>
        <div id='Canvas' ref={ref => this.canvas = ref} style={style}
          onClick={this.handleClick}
          onWheel={this.onWheel} >
          <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag} onStop={this.handleDragStop} >
            <svg viewBox={viewPort} >
              {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} />)}
              {view.nodes.map((node) => <GraphicNode key={node.id} node={node} />)}
              <LassoTool view={view} active={this.lassoToolActive} origin={this.lassoToolOrigin} maxim={this.lassoToolMaxim} />
            </svg>
          </DraggableCore>
          <ZoomControls
            view={view} left={this.canvas ? this.canvas.offsetLeft + this.canvas.offsetWidth : 0} top={this.canvas?.offsetTop ?? 0}
            onPlus={this.increaseZoom}
            onMinus={this.decreaseZoom}
            onZoomToFit={view.zoomToFit} />
          <ContextMenu view={view} canvas={this.canvas  } />
        </div>
        <p> x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p>
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.lassoToolActive) {
      this.lassoToolActive = false;
    } else {
      const { view } = this.props;
      view.clearSelection();
      e.stopPropagation();
    }
  }

  onWheel = (e: React.WheelEvent) => {
    if (e.altKey) {
      const { view } = this.props;
      const zoomfactor = e.deltaY / 200;
      view.x -= zoomfactor * 16;
      view.y -= zoomfactor * 9;
      view.w += zoomfactor * 32;
    } else {
      this.props.view.y += e.deltaY / 10;
    }
  }

  increaseZoom = (view: GraphicalView) => {
    view.x += 16;
    view.y += 9;
    view.w -= 32;
  }

  decreaseZoom = (view: GraphicalView) => {
    view.x -= 16;
    view.y -= 9;
    view.w += 32;
  }

  handleDragStart: DraggableEventHandler = (e, data) => {
    if (e.shiftKey) {
      const { view } = this.props;
      view.clearSelection();
      const offsetLeft = this.canvas?.offsetLeft ?? 0;
      const offsetTop = this.canvas?.offsetTop ?? 0;
      const x = (data.x - offsetLeft) / view.zoom + view.x;
      const y = (data.y - offsetTop) / view.zoom + view.y;
      this.lassoToolOrigin = { x, y };
      this.lassoToolMaxim = { x, y };
      this.lassoToolActive = true;
      e.stopPropagation();
    }
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    const { zoom } = this.props.view;
    if (this.lassoToolActive) {
      transaction(() => {
        this.lassoToolMaxim.x += data.deltaX / zoom;
        this.lassoToolMaxim.y += data.deltaY / zoom;
      })
    } else {
      const { view } = this.props;
      if (view.selection.length > 0) {
        view.clearSelection();
      }
      transaction(() => {
        view.x -= data.deltaX / zoom;
        view.y -= data.deltaY / zoom;
      })
    }
    e.stopPropagation();
  }

  handleDragStop: DraggableEventHandler = (e, data) => {
    if (this.lassoToolActive) {
      console.log('Drag stop')
      const view = this.props.view;
      const minX = Math.min(this.lassoToolOrigin.x, this.lassoToolMaxim.x);
      const minY = Math.min(this.lassoToolOrigin.y, this.lassoToolMaxim.y);
      const maxX = Math.max(this.lassoToolOrigin.x, this.lassoToolMaxim.x);
      const maxY = Math.max(this.lassoToolOrigin.y, this.lassoToolMaxim.y);
      view.selection = view.nodes.filter((n) => (minX < n.x && n.x < maxX) && (minY < n.y && n.y < maxY));
      e.stopPropagation();
    }
  }
}

interface IZoomControls {
  view: GraphicalView;
  left: number;
  top: number;
  onPlus: (view: GraphicalView) => void;
  onMinus: (view: GraphicalView) => void;
  onZoomToFit: () => void;
}

const ZoomControls: React.FC<IZoomControls> = observer((props) => {
  return (
    <div style={{ position: "absolute", top: props.top, left: props.left }}>
      <ZoomIn style={{ position: "absolute", top: 5, right: 20 }}
        onClick={(e) => props.onPlus(props.view)} />
      <ZoomOut style={{ position: "absolute", top: 5, right: 60 }}
        onClick={(e) => props.onMinus(props.view)} />
      <ZoomOutMap style={{ position: "absolute", top: 5, right: 100 }}
        onClick={(e) => props.onZoomToFit()} />
    </div>
  )
})

const ContextMenu: React.FC<{ view: GraphicalView, canvas: HTMLDivElement | null }> = observer((props) => {
  const { view } = props;
  if (view.contextMenuActiveFor === null) {
    return null;
  }
  const element = view.selection.find((n: ViewElement) => view.contextMenuActiveFor === n.id);
  if (!(element instanceof ViewNode)) {
    return null;
  }
  const node = element;
  const { canvas } = props;
  const offsetLeft = canvas?.offsetLeft ?? 0;
  const offsetTop = canvas?.offsetTop ?? 0;
  const x = offsetLeft + (node.x + node.width + 10 - view.x) * view.zoom;
  const y = offsetTop + (node.y - view.y) * view.zoom;

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
      style={{ position: 'absolute', left: x, top: y }}>
      {options.map((option) => {
        return (
          <Button key={option.label} onClick={option.action}>{option.label}</Button>
        )
      })}
    </ButtonGroup>
  );
})

const LassoTool: React.FC<{ view: GraphicalView, active: boolean, origin: Position, maxim: Position }> = observer((props) => {
    const { view, active, origin, maxim } = props;
    const x = Math.min(origin.x, maxim.x);
    const y = Math.min(origin.y, maxim.y);
    const w = Math.abs(maxim.x - origin.x);
    const h = Math.abs(maxim.y - origin.y);

    const style: React.CSSProperties = { strokeDasharray: 2 / view.zoom, stroke: 'grey', strokeWidth: active ? 1 / view.zoom : 0, fill: 'none' };

    return <rect x={x} y={y} width={w} height={h} style={style} />
})

export default Canvas;
