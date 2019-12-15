import React from 'react';
import { ButtonToolbar, Container, Row } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import Application from './model/application';
import Canvas from './graphics/ui/Canvas';
import { ButtonControl, Command } from './graphics/ui/editor-controls';
import { ViewNode } from './graphics/model/view-model';

const app = new Application();
app.title = 'Explore demo';

app.view.nodeColor = (node: ViewNode) => {
  if (node.label === 'First Element') {
    return "#B8E7FC";
  } else {
    return '#D6F8B8';
  }
}


const App: React.FC = () => {
  return (
    <Container className="App">
      <Row>
        <h1>{app.title}</h1>
      </Row>
      <Row>
        <ButtonToolbar className="p-1">
          <ButtonControl label={'Load'} command={onLoad} />
          <ButtonControl label={'Layout'} command={onLayout} />
        </ButtonToolbar>
      </Row>
      <Row>
        <Canvas view={app.view} size={{ width: 1000, height: 600 }} />
      </Row>
    </Container>
  );
}

const onLoad: Command = () => app.api.loadModel(app.view);

// Load the model on startup...
app.api.loadModel(app.view);

const onLayout: Command = () => app.view.layout.apply();

export default App;
