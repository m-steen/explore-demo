import React from 'react';
import { observable, transaction } from 'mobx';
import { observer } from 'mobx-react';
import { Size } from '../model/graphics';
import { GraphicalView } from '../model/view-model';
import GraphicNode from './GraphicNode';
import GraphicLink from './GraphicLink';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';

export interface ICanvas {
  view: GraphicalView;
  size: Size;
}

interface CanvasState {
  zoom: number;
  pan: {x: number, y: number}
}

@observer
class Canvas extends React.Component<ICanvas> {
  @observable
  uiState: CanvasState = {
    zoom: 1.0, 
    pan: { x: 0, y: 0 }
  };

  render() {
    const { view, size } = this.props;
    const { zoom, pan } = this.uiState;
    const pos: React.CSSProperties = { position: "absolute" };
    const w = size.width / zoom;
    const h = size.height / zoom;
    const viewPort = [pan.x + (size.width - w) / 2, pan.y + (size.height - h) / 2, w, h].join(' ');
    const style: React.CSSProperties = { ...pos, ...{ borderStyle: 'solid' } };
    return (
      <div id='Canvas' style={style} onClick={this.handleClick}>
        <DraggableCore onDrag={this.handleDrag}>
          <svg width={'80vw'} height={'80vh'} viewBox={viewPort}>
            {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} view={view} />)}
            {view.nodes.map((node) => <GraphicNode key={node.id} node={node} view={view} zoom={zoom} />)}
          </svg>
        </DraggableCore>
        <ZoomControls state={this.uiState} onPlus={this.increaseZoom} onMinus={this.decreaseZoom} />
      </div>
    );
  }

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    this.props.view.selection = null;
    e.stopPropagation();
  }

  increaseZoom = (state: CanvasState) => {
    if (state.zoom >= 4) {
      state.zoom = 4;
    } else {
      state.zoom += 0.1;
    }
  }

  decreaseZoom = (state: CanvasState) => {
    if (state.zoom <= 0.4) {
      state.zoom = 0.4;
    } else {
      state.zoom -= 0.1;
    }
  }

  handleDrag: DraggableEventHandler = (e, data) => {
    if (!this.props.view.selection) {
      transaction(() => {
        this.uiState.pan.x -= data.deltaX / this.uiState.zoom;
        this.uiState.pan.y -= data.deltaY / this.uiState.zoom;
      })
    }
    e.stopPropagation();
  }

}

interface IZoomControls {
  state: CanvasState;
  onPlus: (state: CanvasState) => void;
  onMinus: (state: CanvasState) => void;
}

const ZoomControls: React.FC<IZoomControls> = (props) => {
  return (
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <div style={{ position: "absolute", top: 0, right: 10, fontSize: 30, fontWeight: "bold" }}
          onClick={(e) => props.onPlus(props.state)}>+</div>
        <div style={{ position: "absolute", top: 0, right: 60, fontSize: 30, fontWeight: "bold" }}
          onClick={(e) => props.onMinus(props.state)}>-</div>
      </div>
  )
}

export default Canvas;
