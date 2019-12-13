import React from 'react';
import './App.css';
import Canvas from './graphics/ui/Canvas';
import { GraphicalView, ViewNode, ViewEdge } from './graphics/model/view-model';
import { v4 as uuid } from 'uuid';

const view = new GraphicalView();
view.nodeColor = (node: ViewNode) => {
  if (node.label === 'First Element') {
    return "#B8E7FC";
  } else {
    return '#D6F8B8';
  }
}

const n1 = new ViewNode();
n1.label = 'First Element';
n1.id = uuid();
n1.x = 300;
n1.y = 200;
n1.width = 120;
n1.height = 60;
view.nodes.push(n1);

const n2 = new ViewNode();
n2.label = 'Second Element';
n2.id = uuid();
n2.x = 600;
n2.y = 400;
n2.width = 120;
n2.height = 60;
view.nodes.push(n2);

const e1 = new ViewEdge(n1, n2);
e1.label = 'relation';
e1.id = uuid();
view.edges.push(e1);


const App: React.FC = () => {
  return (
      <div className="App">
        <h1>Explore demo</h1>
        <Canvas view={view} size={{ width: 1000, height: 800 }} />
      </div>
  );
}

export default App;
