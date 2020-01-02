import { Database, aql } from 'arangojs';
import { v4 as uuid } from 'uuid';
import { GraphicalView, ViewNode, ViewEdge } from '../graphics/model/view-model';

class Api {
  url: string = 'http://bdd-2016-05.bizzdesign.nl:8529';
  username: string = 'root';
  password: string = '';
  db: Database;

  constructor() {
    this.db = new Database({
      url: this.url,
    })
  }

  getObjects: (query: string, view: GraphicalView) => Promise<void> =
    (query, view) => {
      view.layout.stop();
      view.nodes = [];
      view.edges = [];
      console.log(query)
      const aquery = aql`
        FOR obj IN FULLTEXT("Objects", "name", ${query})
        RETURN obj
      `
      console.log(aquery)
      return this.db.query(aquery)
        .then((array) => {
          array.each((obj) => {
            console.log(obj)
            let node = view.nodes.find((x) => obj.id === x.id);
            if (node === undefined) {
              node = new ViewNode();
              node.id = obj.id;
              node.label = obj.name;
              node.layer = obj.meta.category;
              node.type = obj.meta.types[0];
              node.width = 40;
              node.height = 30;
              view.nodes.push(node);
            }
          })
        });
    }

  getRelationsFrom: (node: ViewNode, view: GraphicalView) => Promise<void> =
    (source, view) => {
      const aquery = aql`
        FOR startObj IN Objects
          FILTER startObj.id == ${source.id}
          FOR v, e, p IN 1..1 OUTBOUND startObj
            GRAPH 'objectRelations'
            RETURN {source: startObj, relation: e, target: v}
      `
      console.log(aquery)
      return this.db.query(aquery)
        .then((array) => {
          array.each((result) => {
            console.log(result)
            const { relation: r, target: t } = result;
            let target = view.nodes.find((x) => t.id === x.id);
            if (target === undefined) {
              target = new ViewNode();
              target.id = t.id;
              target.label = t.name;
              target.layer = t.meta.category;
              target.type = t.meta.types[0];
              target.width = 40;
              target.height = 30;
              view.nodes.push(target);
            }
            let edge = view.edges.find((x) => r.id === x.id);
            if (edge === undefined) {
              edge = new ViewEdge(source, target);
              edge.id = r.id;
              edge.label = r.meta.types[1].replace('Relation', '');
              view.edges.push(edge);
            }
          })
        });
    }

  loadModel: (view: GraphicalView) => Promise<void> = (view: GraphicalView) => {
    view.layout.stop();
    view.edges = [];
    view.nodes = [];
    view.zoom = 1.0;
    view.x = 0;
    view.y = 0;
    return new Promise((resolve) => {

      const n1 = new ViewNode();
      n1.label = 'First Element';
      n1.id = uuid();
      n1.x = 300;
      n1.y = 200;
      n1.width = 40;
      n1.height = 30;
      view.nodes.push(n1);

      const n2 = new ViewNode();
      n2.label = 'Second Element';
      n2.id = uuid();
      n2.x = 600;
      n2.y = 400;
      n2.width = 40;
      n2.height = 30;
      view.nodes.push(n2);

      const n3 = new ViewNode();
      n3.label = 'Third Element';
      n3.id = uuid();
      n3.x = 500;
      n3.y = 300;
      n3.width = 40;
      n3.height = 30;
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