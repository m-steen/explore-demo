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

  componentDidMount() {
    const { view } = this.props;
    view.absoluteX = calculateOffset(this.canvas, 'offsetLeft');
    view.absoluteY = calculateOffset(this.canvas, 'offsetTop');
    view.absoluteW = this.canvas?.offsetWidth ?? view.absoluteW;
    view.absoluteH = this.canvas?.offsetHeight ?? view.absoluteH;

    // workaround for Chrome removing preventDefault from wheel events
    if (this.canvas) {
      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }
  }

  componentWillUnmount() {
    if (this.canvas) {
      this.canvas.removeEventListener('wheel', this.onWheel);
    }
  }

  componentDidUpdate() {
    const { view } = this.props;
    view.absoluteX = calculateOffset(this.canvas, 'offsetLeft');
    view.absoluteY = calculateOffset(this.canvas, 'offsetTop');
    view.absoluteW = this.canvas?.offsetWidth ?? view.absoluteW;
    view.absoluteH = this.canvas?.offsetHeight ?? view.absoluteH;
  }

  render() {
    const { view } = this.props;
    const { x, y, w, h } = view;
    const viewPort = [x, y, w, h].join(' ');
    const style: React.CSSProperties = { };
    return (
      <div style={{ width: '100%' }}>
        <div id='Canvas' ref={ref => this.canvas = ref} style={style}
          onClick={this.handleClick}
           >
          <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag} onStop={this.handleDragStop} >
            <svg viewBox={viewPort} >
              {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} />)}
              {view.nodes.map((node) => <GraphicNode key={node.id} node={node} />)}
              <LassoTool view={view} active={this.lassoToolActive} origin={this.lassoToolOrigin} maxim={this.lassoToolMaxim} />
            </svg>
          </DraggableCore>
          <ZoomControls
            view={view}
            onPlus={this.increaseZoom}
            onMinus={this.decreaseZoom}
            onZoomToFit={view.zoomToFit} />
          <ContextMenu view={view} />
        </div>
        {/* <p> x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p> */}
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.lassoToolActive) {
      this.lassoToolActive = false;
    } else {
      const { view } = this.props;
      view.clearSelection();
    }
    e.stopPropagation();
  }

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.altKey) {
      const { view } = this.props;
      const zoomfactor = e.deltaY / 30;
      view.x -= zoomfactor * 4;
      view.y -= zoomfactor * 3;
      view.w += zoomfactor * 8;
    } else {
      this.props.view.y += e.deltaY / 5;
    }
  }

  increaseZoom = (view: GraphicalView) => {
    view.x += 40;
    view.y += 30;
    view.w -= 80;
  }

  decreaseZoom = (view: GraphicalView) => {
    view.x -= 40;
    view.y -= 30;
    view.w += 80;
  }

  handleDragStart: DraggableEventHandler = (e, data) => {
    if (e.shiftKey && this.props.view.selection.length === 0) {
      const { view } = this.props;
      view.clearSelection();
      const offsetLeft = view.absoluteX // calculateOffset(this.canvas, 'offsetLeft');
      const offsetTop = view.absoluteY // calculateOffset(this.canvas, 'offsetTop');
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
      view.selection = (view.nodes.filter((n) => (minX < n.x && n.x < maxX) && (minY < n.y && n.y < maxY)) as ViewElement[])
        .concat(view.edges.filter((e) => 
          (minX < Math.min(e.source.x, e.target.x) && Math.max(e.source.x, e.target.x) < maxX) && 
          (minY < Math.min(e.source.y, e.target.y) && Math.max(e.source.y, e.target.y) < maxY)) as ViewElement[]);
      e.stopPropagation();
    }
  }
}

interface IZoomControls {
  view: GraphicalView;
  // left: number;
  // top: number;
  onPlus: (view: GraphicalView) => void;
  onMinus: (view: GraphicalView) => void;
  onZoomToFit: () => void;
}

const ZoomControls: React.FC<IZoomControls> = observer((props) => {
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
})

const ContextMenu: React.FC<{ view: GraphicalView}> = observer((props) => {
  const { view } = props;
  if (view.contextMenuActiveFor === null) {
    return null;
  }
  const element = view.selection.find((n: ViewElement) => view.contextMenuActiveFor === n.id);
  if (!(element instanceof ViewNode)) {
    return null;
  }
  const node = element;
  const x = (node.x + node.width + 10 - view.x) * view.zoom;
  const y = (node.y - view.y) * view.zoom;

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

    const style: React.CSSProperties = { strokeDasharray: view.zoom !== 0 ? 2 / view.zoom : 0, stroke: 'grey', strokeWidth: active && view.zoom !== 0 ? 1 / view.zoom : 0, fill: 'none' };

    return <rect x={x} y={y} width={w} height={h} style={style} />
})

const calculateOffset: (element: HTMLElement | null, offset: string) => number =
  (element, offset) => {
    if (element && element instanceof HTMLElement) {
      let currentOffset = 0;
      switch (offset) {
        case 'offsetTop': {
          currentOffset = element.offsetTop;
          break;
        }
        case 'offsetLeft': {
          currentOffset = element.offsetLeft;
          break;
        }
      }
      const parent = element.offsetParent;
      if (parent && parent instanceof HTMLElement) {
        return calculateOffset(parent, offset) + currentOffset;
      } else {
        return currentOffset;
      }
    } else {
      return 0;
    }
  }

export default Canvas;
