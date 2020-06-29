import { transaction } from 'mobx';
import { Database, aql } from 'arangojs';
import { v4 as uuid } from 'uuid';
import { GraphicalView, ViewNode, ViewEdge } from '../graphics/model/view-model';
import { Filter } from '../model/application';

function object2Node(object: {[key: string]: any}, view: GraphicalView) {
  const node = new ViewNode(view);
  node.id = object.id;
  node.label = object.name;
  node.layer = object.layer;
  node.type = object.type;
  node.shape = object.type;
  node.width = 40;
  node.height = 30;
  return node;
}

function addProperties(node: ViewNode, documents: {[key: string]: any}[]) {
  let properties: {[key: string]: any} = {};
  documents.forEach((doc: {[key: string]: any}) => {
    Object.keys(doc).forEach((key) => {
      properties[key] = doc[key];
    })
  });
  node.properties = properties;
  return node;
}

class Api {
  url: string = 'http://big.bizzdesign.io:8529';
  username: string = 'maarten';
  password: string = 'uAXTUAf8WW4Uk5zjpwfN7SE5h6a';
  database: string = 'repo';
  db: Database;

  constructor() {
    this.db = new Database({
      url: this.url,
    });
    this.db.useDatabase(this.database);
    this.db.useBasicAuth(this.username, this.password);
  }

  getObjects: (query: string, filter: Filter, view: GraphicalView) => Promise<void> =
    (query, filter, view) => {
      view.layout.stop();
      const iteratorPart = query.length === 0 ? aql`FOR object IN Objects` : aql`FOR object IN FULLTEXT("Objects", "name", ${query})`;
      const layerFilter = filter.layers.length > 0 ? aql`FILTER object.layer IN ${filter.layers}` : aql``;
      const typeFilter = filter.types.length > 0 ? aql`FILTER object.type IN ${filter.types}` : aql``;

      const aquery = aql`
        ${iteratorPart}
        ${layerFilter}
        ${typeFilter}
        LET documents = (
          FOR v, document, p IN 1..1 OUTBOUND object
          GRAPH "properties"
          RETURN document
        )
        RETURN { object, documents }`;
      console.log(aquery)
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each(({ object, documents }: { object: {[key: string]: any}, documents: {[key: string]: any}[] }) => {
              console.log(object, documents)
              let node = view.nodes.find((x) => object.id === x.id);
              if (node === undefined) {
                node = object2Node(object, view);
                addProperties(node, documents);
                console.log(node)
                view.nodes.push(node);
                view.selection.push(node);
              }
            })
          })
        });
    }

  getRelationsFrom: (node: ViewNode, filter: Filter, view: GraphicalView) => Promise<void> =
    (source, filter, view) => {
      const relationFilter = filter.relations.length > 0 ? aql`FILTER e.meta.types[1] IN ${filter.relations}` : aql``;
      const typeFilter = filter.types.length > 0 ? aql`FILTER v.meta.types[0] IN ${filter.types}` : aql``;
      const aquery = aql`
        FOR v, e, p IN 1..1 OUTBOUND ${'Objects/' + source.id}
        GRAPH "objectRelations"
        ${relationFilter}
        ${typeFilter}
        LET documents = (
          FOR w, document IN 1..1 OUTBOUND v
          GRAPH "properties"
          RETURN document
        )
        RETURN {source: DOCUMENT(${'Objects/' + source.id}), relation: e, target: v, documents}
      `
      console.log(aquery)
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result) => {
              console.log(result)
              const { relation: r, target: t, documents } = result;
              if (!t || !r) { // workaround for incomplete data
                return;
              }
              let target = view.nodes.find((x) => t.id === x.id);
              if (target === undefined) {
                target = object2Node(t, view);
                addProperties(target, documents);
                view.nodes.push(target);
                view.selection.push(target);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                edge = new ViewEdge(view, source, target);
                edge.id = r.id;
                edge.label = r.meta.types[1].replace('Relation', '');
                edge.type = r.meta.types[1];
                view.edges.push(edge);
              }
            })
          })
        });
    }

  getRelationsTo: (node: ViewNode, filter: Filter, view: GraphicalView) => Promise<void> =
    (target, filter, view) => {
      const relationFilter = filter.relations.length > 0 ? aql`FILTER e.meta.types[1] IN ${filter.relations}` : aql``;
      const typeFilter = filter.types.length > 0 ? aql`FILTER v.meta.types[0] IN ${filter.types}` : aql``;
      const aquery = aql`
        FOR v, e, p IN 1..1 INBOUND ${'Objects/' + target.id}
        GRAPH "objectRelations"
        ${relationFilter}
        ${typeFilter}
        LET documents = (
          FOR w, document IN 1..1 OUTBOUND v
          GRAPH "properties"
          RETURN document
        )
        RETURN {source: v, documents, relation: e, target: DOCUMENT(${'Objects/' + target.id})}
      `
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result) => {
              console.log(result)
              const { source: s, relation: r, documents } = result;
              if (!s || !r) { // workaround for incomplete data
                return;
              }
              let source = view.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = object2Node(s, view);
                addProperties(source, documents);
                view.nodes.push(source);
                view.selection.push(source);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                edge = new ViewEdge(view, source, target);
                edge.id = r.id;
                edge.label = r.meta.types[1].replace('Relation', '');
                edge.type = r.meta.types[1];
                view.edges.push(edge);
              }
            })
          })
        });
    }

    expandRelations: (node: ViewNode, filter: Filter, view: GraphicalView) => Promise<void> =
    (node, filter, view) => {
      let promise: Promise<void> = Promise.resolve();
      if (filter.outgoing) {
        promise = this.getRelationsFrom(node, filter, view);
      }
      if (filter.incoming) {
        promise = promise.then(() => this.getRelationsTo(node, filter, view));
      }
      return promise;
    }

    loadAll: (view: GraphicalView) => Promise<void> =
    (view) => {
      const aquery = aql`
      FOR s IN Objects
      LET sourceDocuments = (
        FOR w, document IN 1..1 OUTBOUND s
        GRAPH "properties"
        RETURN document
      )
      FOR t, e, p IN 1..1 OUTBOUND s
        GRAPH 'objectRelations'
        LET targetDocuments = (
          FOR u, document IN 1..1 OUTBOUND t
          GRAPH "properties"
          RETURN document
        )
          RETURN {source: s, sourceDocuments, relation: e, target: t, targetDocuments}
      `
      console.log(aquery)
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result) => {
              const { source: s, sourceDocuments, relation: r, target: t, targetDocuments } = result;
              let source = view.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = object2Node(s, view);
                addProperties(source, sourceDocuments);
                view.nodes.push(source);
              }
              if (t) {
                let target = view.nodes.find((x) => t.id === x.id);
                if (target === undefined) {
                  target = object2Node(t, view);
                  addProperties(target, targetDocuments);
                  view.nodes.push(target);
                }
                let edge = view.edges.find((x) => r.id === x.id);
                if (edge === undefined) {
                  edge = new ViewEdge(view, source, target);
                  edge.id = r.id;
                  edge.label = r.meta.types[1].replace('Relation', '');
                  edge.type = r.meta.types[1];
                  view.edges.push(edge);
                }
              }
            })
          })
        });
    }

  loadModel: (view: GraphicalView) => Promise<void> = (view: GraphicalView) => {
    view.clear();
    return new Promise((resolve) => {

      transaction(() => {
        const n1 = new ViewNode(view);
        n1.label = 'First Element';
        n1.id = uuid();
        n1.x = 300;
        n1.y = 200;
        n1.width = 40;
        n1.height = 30;
        view.nodes.push(n1);
  
        const n2 = new ViewNode(view);
        n2.label = 'Second Element';
        n2.id = uuid();
        n2.x = 600;
        n2.y = 400;
        n2.width = 40;
        n2.height = 30;
        view.nodes.push(n2);
  
        const n3 = new ViewNode(view);
        n3.label = 'Third Element';
        n3.id = uuid();
        n3.x = 500;
        n3.y = 300;
        n3.width = 40;
        n3.height = 30;
        view.nodes.push(n3);
  
        const e1 = new ViewEdge(view, n1, n2);
        e1.label = 'relation';
        e1.id = uuid();
        view.edges.push(e1);
  
        const e2 = new ViewEdge(view, n1, n3);
        e2.label = 'relation';
        e2.id = uuid();
        view.edges.push(e2);
      })

      resolve();
    });
  }
}

export default Api;