import React from 'react';
import { transaction, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Position } from '../../graphics/graphics';
import { ViewModel, ViewNode, ViewEdge, EdgeSegment } from '../../model/view-model';
import DiagramNode from './DiagramNode';
import DiagramLink from './DiagramLink';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { ZoomIn, ZoomOut, ZoomOutMap, AspectRatio } from '@material-ui/icons';
import { ButtonGroup, Button } from 'react-bootstrap';

export interface DiagramProps {
  view: ViewModel;
}

@observer
class Diagram extends React.Component<DiagramProps> {
  canvas: HTMLDivElement | null = null;
  dragging = false;
  @observable lassoToolActive = false;
  @observable lassoToolOrigin = { x: 0, y: 0 };
  @observable lassoToolMaxim = { x: 0, y: 0 };

  componentDidMount() {
    const { view } = this.props;
    view.setPosition(
      calculateOffset(this.canvas, 'offsetLeft'), 
      calculateOffset(this.canvas, 'offsetTop'));
    view.setSize(
      this.canvas?.offsetWidth ?? view.size.width,
      this.canvas?.offsetHeight ?? view.size.height
    );
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
    view.setPosition(
      calculateOffset(this.canvas, 'offsetLeft'), 
      calculateOffset(this.canvas, 'offsetTop'));
    view.setSize(
      this.canvas?.offsetWidth ?? view.size.width,
      this.canvas?.offsetHeight ?? view.size.height
    );
  }

  render() {
    const { view } = this.props;
    const viewPort = view.viewport.join(' ');
    const style: React.CSSProperties = {};
    return (
      <div style={{ width: '100%' }}>
        <div id='Canvas' ref={ref => this.canvas = ref} style={style}>
          <DraggableCore onStart={this.handleDragStart} onDrag={this.handleDrag} onStop={this.handleDragStop} >
            <svg viewBox={viewPort} >
              {view.edges.map((edge) => <DiagramLink key={(edge instanceof EdgeSegment) ? edge.id + edge.target.id : edge.id} edge={edge} />)}
              {view.nodes.map((node) => <DiagramNode key={node.id} node={node} />)}
              <LassoTool view={view} active={this.lassoToolActive} origin={this.lassoToolOrigin} maxim={this.lassoToolMaxim} />
            </svg>
          </DraggableCore>
          <ZoomControls
            view={view}
            onPlus={this.increaseZoom}
            onMinus={this.decreaseZoom}
            onZoomToFit={view.zoomToFit}
            onLayout={(view: ViewModel) => view.layout.apply()} />
          <ContextMenu view={view} />
        </div>
        {/* <p> x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p> */}
      </div>
    );
  }

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const { view } = this.props;
    if (e.ctrlKey) {
      const zoomBy = -e.deltaY / 5;
      const x = (e.x - view.origin.x) / view.zoomFactor + view.x;
      const y = (e.y - view.origin.y) / view.zoomFactor + view.y;
      view.zoomTo(x, y, zoomBy);
    } else {
      view.pan(e.deltaX / 3, e.deltaY / 5);
    }
  }

  increaseZoom = (view: ViewModel) => {
    view.zoom(40);
  }

  decreaseZoom = (view: ViewModel) => {
    view.zoom(-40);
  }

  handleDragStart: DraggableEventHandler = (e, data) => {
    if (e.shiftKey) {
      this.lassoToolActive = true;
      const { view } = this.props;
      view.getEditor().clearSelection();
      const offsetLeft = view.origin.x;
      const offsetTop = view.origin.y;
      const x = (data.x - offsetLeft) / view.zoomFactor + view.x;
      const y = (data.y - offsetTop) / view.zoomFactor + view.y;
      this.lassoToolOrigin = { x, y };
      this.lassoToolMaxim = { x, y };
    }
    e.stopPropagation();
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    this.dragging = true;
    const { zoomFactor } = this.props.view;
    if (this.lassoToolActive) {
      transaction(() => {
        this.lassoToolMaxim.x += data.deltaX / zoomFactor;
        this.lassoToolMaxim.y += data.deltaY / zoomFactor;
      })
    } else {
      const { view } = this.props;
      transaction(() => {
        view.x -= data.deltaX / zoomFactor;
        view.y -= data.deltaY / zoomFactor;
      })
    }
    e.stopPropagation();
  }

  handleDragStop: DraggableEventHandler = (e, data) => {
    if (this.lassoToolActive) {
      const { view } = this.props;
      const minX = Math.min(this.lassoToolOrigin.x, this.lassoToolMaxim.x);
      const minY = Math.min(this.lassoToolOrigin.y, this.lassoToolMaxim.y);
      const maxX = Math.max(this.lassoToolOrigin.x, this.lassoToolMaxim.x);
      const maxY = Math.max(this.lassoToolOrigin.y, this.lassoToolMaxim.y);
      const selection: string[] = (view.nodes.filter((n) => (minX < n.x && n.x < maxX) && (minY < n.y && n.y < maxY)) as ViewNode[]).map((e) => e.id)
        .concat((view.edges.filter((e) => 
          (minX < Math.min(e.source.x, e.target.x) && Math.max(e.source.x, e.target.x) < maxX) && 
          (minY < Math.min(e.source.y, e.target.y) && Math.max(e.source.y, e.target.y) < maxY)) as ViewEdge[]).map((e) => e.id));
          view.getEditor().setSelection(selection);
      this.lassoToolActive = false;
      e.stopPropagation();
    }
    if (this.dragging) {
      this.dragging = false;
      e.stopPropagation();
    } else {
      const { view } = this.props;
      view.getEditor().clearSelection();
      view.contextMenuActiveFor = null;
    }
  }
}

interface IZoomControls {
  view: ViewModel;
  onPlus: (view: ViewModel) => void;
  onMinus: (view: ViewModel) => void;
  onZoomToFit: () => void;
  onLayout: (view: ViewModel) => void;
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
      <AspectRatio style={{ position: "absolute", top: 5, right: 140 }}
      onClick={(e) => props.onLayout(props.view)} />
    </div>
  )
})

const ContextMenu: React.FC<{ view: ViewModel}> = observer((props) => {
  const { view } = props;
  if (view.contextMenuActiveFor === null) {
    return null;
  }
  const node = view.nodes.find((node) => node.id === view.contextMenuActiveFor && node.isSelected);
  if (!node) {
    return null;
  }
  const x = (node.x + node.width + 10 - view.x) * view.zoomFactor;
  const y = (node.y - view.y) * view.zoomFactor;

  const nodeMenu = view.nodeMenu();
  const options = nodeMenu.options.map((option) => {
    const action = () => view.nodes.filter((node) => node.isSelected)
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

const LassoTool: React.FC<{ view: ViewModel, active: boolean, origin: Position, maxim: Position }> = observer((props) => {
    const { view, active, origin, maxim } = props;
    const x = Math.min(origin.x, maxim.x);
    const y = Math.min(origin.y, maxim.y);
    const w = Math.abs(maxim.x - origin.x);
    const h = Math.abs(maxim.y - origin.y);

    const style: React.CSSProperties = { strokeDasharray: view.zoomFactor !== 0 ? 2 / view.zoomFactor : 0, stroke: 'grey', strokeWidth: active && view.zoomFactor !== 0 ? 1 / view.zoomFactor : 0, fill: 'none' };

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

export default Diagram;
