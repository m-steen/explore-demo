import { v4 as uuid } from 'uuid';
import { GraphicalView, ViewNode, ViewEdge } from '../graphics/model/view-model';

class Api {
  url: string = '';
  username: string = '';
  password: string = '';

  loadModel: (view: GraphicalView) => Promise<void> = (view: GraphicalView) => {
    view.layout.stop();
    view.nodes = [];
    view.edges = [];
    return new Promise((resolve) => {

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

      // simulating 1s latency in retrieving model
      setTimeout(resolve, 1000);
    });
  }
}

export default Api;