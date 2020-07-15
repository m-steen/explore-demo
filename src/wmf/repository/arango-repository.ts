import { transaction, observable } from 'mobx';
import { Database, aql } from 'arangojs';
import { Filter } from '../../model/application';
import { IObject, IDocument, IRelation } from '../model/model';
import { Repository, User } from './repository';
import { ViewModel, ViewNode } from '../model/view-model';

function removeMetaData(doc: IDocument): IDocument {
  const metaDataProps = ['_key', '_id', '_rev', '_from', '_to'];
  metaDataProps.forEach((prop) => {
    if (doc[prop]) {
      delete doc[prop];
    }
  })
  return doc;
}

class ArangoRepository implements Repository {

  url: string = 'http://localhost:8529';
  db: Database = new Database({
    url: this.url
  });
  @observable availableDatabases: string[] = [];
  @observable database: string | undefined;
  @observable user: User | undefined;
  @observable loggedIn: boolean = false;
  @observable loginFailed: boolean = false;

  setUrl(url: string) {
    this.url = url;
    this.db = new Database({
      url: this.url,
    });
  }

  login(username: string, password: string): Promise<string> {
    return this.db.login(username, password)
      .then((_token) => {
        this.loggedIn = true;
        this.loginFailed = false;
        this.db.useBasicAuth(username, password);
        this.user = { username, password };
        return 'success';
      })
      .catch((_err) => {
        this.loggedIn = false;
        this.loginFailed = true;
        return 'failed';
      })
      .then((result: string) => {
        if (result === 'success') {
          return this.db.listUserDatabases()
          .then((result: string[]) => {
            this.availableDatabases = result.filter((dbName) => '_system' !== dbName);
            return 'success';
          })
          .catch((err) => {
            return 'noData';
          })
        } else {
          return 'failed';
        }
      })
  }

  listDatabases(): string[] {
    return this.availableDatabases;
  }

  selectDatabase(dbName: string): boolean {
    if (this.availableDatabases.includes(dbName)) {
      this.database = dbName;
      this.db.useDatabase(dbName);
      return true;
    } else {
      delete this.database;
      return false;
    }
  }

  fetchObjects(view: ViewModel, query: string, filter: Filter) {
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
    return this.db.query(aquery)
      .then((array) => {
        transaction(() => {
          array.each(({ object, documents }: { object: IObject, documents: IDocument[] }) => {
            let node = view.nodes.find((x) => object.id === x.id);
            if (node === undefined) {
              node = view.addNode(object.type, object.name, object.id);
              node.layer = object.layer;
              documents.forEach((doc) => {
                return Object.keys(removeMetaData(doc)).forEach((name) => node?.setProperty(name, doc[name]))
              });
              view.getEditor().selectElement(node);
            }
          })
        })
      });
  }

  getRelationsFrom: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
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
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result: { relation: IRelation, target: IObject, documents: IDocument[] }) => {
              console.log(result)
              const { relation: r, target: t, documents } = result;
              if (!t || !r) { // workaround for incomplete data
                return;
              }
              let target = view.nodes.find((x) => t.id === x.id);
              if (target === undefined) {
                target = view.addNode(t.type, t.name, t.id);
                documents.forEach((doc) => Object.keys(doc).forEach((name) => target?.setProperty(name, doc[name])));
                view.getEditor().selectElement(target);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                view.addEdge(r.type, source, target, r.name, r.id);
              }
            })
          })
        });
    }

  getRelationsTo: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
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
            array.each((result: { source: IObject, documents: IDocument[], relation: IRelation }) => {
              console.log(result)
              const { source: s, relation: r, documents } = result;
              if (!s || !r) { // workaround for incomplete data
                return;
              }
              let source = view.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = view.addNode(s.type, s.name, s.id);
                documents.forEach((doc) => Object.keys(doc).forEach((name) => source?.setProperty(name, doc[name])));
                view.getEditor().selectElement(source);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                view.addEdge(r.type, source, target, r.name, r.id);
              }
            })
          })
        });
    }

  expandRelations: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
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

  loadModel: (model: ViewModel) => Promise<void> =
    (model) => {
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
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result: { source: IObject, sourceDocuments: IDocument[], relation: IRelation, target: IObject, targetDocuments: IDocument[] }) => {
              const { source: s, sourceDocuments, relation: r, target: t, targetDocuments } = result;
              let source = model.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = model.addNode(s.type, s.name, s.id);
                source.layer = s.layer;
                sourceDocuments.forEach((doc) => Object.keys(removeMetaData(doc)).forEach((name) => source?.setProperty(name, doc[name])));
              }
              if (t) {
                let target = model.nodes.find((x) => t.id === x.id);
                if (target === undefined) {
                  target = model.addNode(t.type, t.name, t.id);
                  targetDocuments.forEach((doc) => Object.keys(removeMetaData(doc)).forEach((name) => target?.setProperty(name, doc[name])));
                }
                let edge = model.edges.find((x) => r.id === x.id);
                if (edge === undefined) {
                  edge = model.addEdge(r.type, source, target, r.type.replace('Relation', ''), r.id);
                }
              }
            })
          })
        });
    }

  initTestModel: (model: ViewModel) => Promise<void> = (model: ViewModel) => {
    model.clear();
    return new Promise((resolve) => {

      transaction(() => {
        const n1 = model.addNode('Node', 'First Element');
        const n2 = model.addNode('Node', 'Second Element');
        const n3 = model.addNode('Node', 'Third Element');

        model.addEdge('Relation', n1, n2, 'relation');
        model.addEdge('Relation', n1, n3, 'relation');
      })

      resolve();
    });
  }
}

export default ArangoRepository;