import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Container } from 'react-bootstrap';
import { Size } from '../model/graphics';
import { GraphicalView } from '../model/view-model';
import GraphicNode from './GraphicNode';
import GraphicLink from './GraphicLink';

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
  @observable uiState: CanvasState = {
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
    const style: React.CSSProperties = {...pos, ...size, ...{borderStyle: 'solid'}};
      return (
      <Container id='Canvas' style={style} onClick={this.handleClick}>
        <svg width={size.width} height={size.height} viewBox={viewPort}>
          {view.edges.map((edge) => <GraphicLink key={edge.id} edge={edge} view={view}/>)}
          {view.nodes.map((node) => <GraphicNode key={node.id} node={node} view={view}/>)}
        </svg>
        <ZoomControls state={this.uiState} onPlus={this.increaseZoom} onMinus={this.decreaseZoom} />
      </Container>
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

  handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log(e)
  }
}

interface IZoomControls {
  state: CanvasState;
  onPlus: (state: CanvasState) => void;
  onMinus: (state: CanvasState) => void;
}

const ZoomControls: React.FC<IZoomControls> = (props) => {
  return (
      <div style={{ position: "absolute", bottom: 0, right: 0 }}>
        <div style={{ position: "absolute", bottom: 0, right: 10, fontSize: 30, fontWeight: "bold" }}
          onClick={(e) => props.onPlus(props.state)}>+</div>
        <div style={{ position: "absolute", bottom: 0, right: 60, fontSize: 30, fontWeight: "bold" }}
          onClick={(e) => props.onMinus(props.state)}>-</div>
      </div>
  )
}

export default Canvas;
