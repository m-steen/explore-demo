import React from 'react';
import { transaction } from 'mobx';
import { observer } from 'mobx-react';
import { Size } from '../model/graphics';
import { GraphicalView } from '../model/view-model';
import GraphicNode from './GraphicNode';
import GraphicLink from './GraphicLink';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { ZoomIn, ZoomOut, ZoomOutMap } from '@material-ui/icons';

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
      <div id='Canvas' style={style} onClick={this.handleClick}>
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
      </div>
      <p>x: {view.x}, y: {view.y}, w: {view.w}, h: {view.h}, zoom: {view.zoom}</p>
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.view.selection = null;
    e.stopPropagation();
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

export default Canvas;
