import React, { useState, useEffect } from 'react';
import { Button, ButtonToolbar, Container, Row } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import Canvas from './graphics/ui/Canvas';
import { GraphicalView, ViewNode } from './graphics/model/view-model';
import Database from './backend/api';

const store = {
  db: new Database(),
  view: new GraphicalView(),
}
// const view = new GraphicalView();

store.view.nodeColor = (node: ViewNode) => {
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
        <h1>Explore demo</h1>
      </Row>
      <Row>
        <ButtonToolbar className="p-1">
          <LoadButton />
          <Button className="mr-1">Layout</Button>
        </ButtonToolbar>
      </Row>
      <Row>
        <Canvas view={store.view} size={{ width: 1000, height: 600 }} />
      </Row>
    </Container>
  );
}

function LoadButton() {
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      store.db.loadModel(store.view).then(() => {
        setLoading(false);
      });
    }
  }, [isLoading]);

  const handleClick = () => setLoading(true);

  return (
    <Button className="mr-1"
      variant="primary"
      disabled={isLoading}
      onClick={!isLoading ? handleClick : () => {}}
    >
      {isLoading ? 'Loading…' : 'Load'}
    </Button>
  );
}

export default App;
