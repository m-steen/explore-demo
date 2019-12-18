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
      n1.width = 40;
      n1.height = 16;
      view.nodes.push(n1);

      const n2 = new ViewNode();
      n2.label = 'Second Element';
      n2.id = uuid();
      n2.x = 600;
      n2.y = 400;
      n2.width = 40;
      n2.height = 16;
      view.nodes.push(n2);

      const n3 = new ViewNode();
      n3.label = 'Third Element';
      n3.id = uuid();
      n3.x = 500;
      n3.y = 300;
      n3.width = 40;
      n3.height = 16;
      view.nodes.push(n3);

      const e1 = new ViewEdge(n1, n2);
      e1.label = 'relation';
      e1.id = uuid();
      view.edges.push(e1);

      const e2 = new ViewEdge(n1, n3);
      e2.label = 'relation';
      e2.id = uuid();
      view.edges.push(e2);

      // simulating 1s latency in retrieving model
      setTimeout(resolve, 1000);
    });
  }
}

export default Api;