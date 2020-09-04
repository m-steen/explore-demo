import { transaction, observable } from 'mobx';
import { Database, aql } from 'arangojs';
import { Filter } from '../../model/application';
import { IObject, IRelation, MModel, MObject } from '../model/model';
import { Repository, User } from './repository';
import { ViewModel, ViewNode } from '../model/view-model';
import Property from '../model/properties';

// function removeMetaData(doc: IDocument): IDocument {
//   const metaDataProps = ['_key', '_id', '_rev', '_from', '_to', 'name', 'type', 'label'];
//   metaDataProps.forEach((prop) => {
//     if (doc[prop]) {
//       delete doc[prop];
//     }
//   })
//   return doc;
// }

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
    if (!password || password.length === 0) {
      return this.db.listUserDatabases()
        .then((result: string[]) => {
          this.availableDatabases = result.filter((dbName) => '_system' !== dbName);
          this.loggedIn = true;
          this.loginFailed = false;
          return 'success';
        })
        .catch((_err) => {
          this.loggedIn = false;
          this.loginFailed = true;
          return 'failed';
        })
    }

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
    const layerFilter = filter.layers.length > 0 ? aql`FILTER object._domain IN ${filter.layers}` : aql``;
    const typeFilter = filter.types.length > 0 ? aql`FILTER object._type IN ${filter.types}` : aql``;

    const aquery = aql`
      ${iteratorPart}
      ${layerFilter}
      ${typeFilter}
      LET parents = (
        FOR parent IN 1..1 OUTBOUND object
        GRAPH "nestingGraph"
        RETURN parent
      )
      LET children = (
        FOR child IN 1..1 INBOUND object
        GRAPH "nestingGraph"
        RETURN child
      )
      RETURN { object, parents, children }`;
    return this.db.query(aquery)
      .then((array) => {
        transaction(() => {
          array.each(({ object, parents, children }: { object: IObject, parents: IObject[], children: IObject[] }) => {
            let node = view.nodes.find((x) => object.id === x.id);
            if (node === undefined) {
              node = view.addNode(object._type, object._name, object.id);
              node._domain = object._domain;
              node._isContainer = object._isContainer;
              Object.keys(object).forEach((key) => {
                if (Property.isProperty(object[key])) {
                  node?.setProperty(key, object[key]);
                }
              });
              console.log(object.name, parents, children.map((c) => c.id))
              if (parents.length > 0 && parents[0]) {
                node.parentID = parents[0].id;
              }
              if (children) {
                node.children = children.map((child) => child.id);
              }
              view.editor.selectElement(node);
            }
          })
        })
      });
  }

  fetchChildren(model: MModel, object: MObject) {

    if (object.children.length > 0 && object.children.every((childID) => model.objects.some((obj) => childID === obj.id))) {
      return new Promise<void>((resolve) => resolve());
    }

    const aquery = aql`
      FOR child IN 1..1 INBOUND ${'Objects/' + object.id}
      GRAPH "nestingGraph"
      FILTER child._kind == 'object'
      RETURN child
    `;

    return this.db.query(aquery)
      .then((array) => {
        transaction(() => {
          array.each((child: IObject) => {
            let node = model.objects.find((x) => child.id === x.id);
            if (node === undefined) {
              if (model instanceof ViewModel) {
                node = model.addNode(child._type, child._name, child.id);
              } else {
                node = model.addObject(child._type, child._name, child.id);
              }
              node._domain = child._domain;
              node._isContainer = object._isContainer;
              node.parentID = object.id;
              if (!object.children.includes(child.id)) {
                object.children.push(child.id);
              }
            }
          })
        })
      })
  }

  getRelationsFrom: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
    (source, filter, view) => {
      const relationFilter = filter.relations.length > 0 ? aql`FILTER relation._type IN ${filter.relations}` : aql``;
      const typeFilter = filter.types.length > 0 ? aql`FILTER target._type IN ${filter.types}` : aql``;
      const aquery = aql`
        FOR target, relation, p IN 1..1 OUTBOUND ${'Objects/' + source.id}
        GRAPH "objectRelations"
        ${relationFilter}
        ${typeFilter}
        LET parents = (
          FOR parent IN 1..1 OUTBOUND target
          GRAPH "nestingGraph"
          RETURN parent
        )
        LET children = (
          FOR child IN 1..1 INBOUND target
          GRAPH "nestingGraph"
          RETURN child
        )
        RETURN {source: DOCUMENT(${'Objects/' + source.id}), relation, target, parents, children}
      `
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result: { relation: IRelation, target: IObject, parents: IObject[], children: IObject[] }) => {
              const { relation: r, target: t, parents, children } = result;
              if (!t || !r) { // workaround for incomplete data
                return;
              }
              let target = view.nodes.find((x) => t.id === x.id);
              if (target === undefined) {
                target = view.addNode(t._type, t._name, t.id);
                target._domain = t._domain;
                target._isContainer = t._isContainer;
                Object.keys(t).forEach((key) => {
                  if (Property.isProperty(t[key])) {
                    target?.setProperty(key, t[key]);
                  }
                });
                if (parents.length > 0) {
                  target.parentID = parents[0].id;
                }
                if (children) {
                  target.children = children.map((child) => child.id);
                }
                view.getEditor().selectElement(target);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                view.addEdge(r._type, source, target, r._name, r.id);
              }
            })
          })
        });
    }

  getRelationsTo: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
    (target, filter, view) => {
      const relationFilter = filter.relations.length > 0 ? aql`FILTER relation._type IN ${filter.relations}` : aql``;
      const typeFilter = filter.types.length > 0 ? aql`FILTER source._type IN ${filter.types}` : aql``;
      const aquery = aql`
        FOR source, relation, p IN 1..1 INBOUND ${'Objects/' + target.id}
        GRAPH "objectRelations"
        ${relationFilter}
        ${typeFilter}
        LET parents = (
          FOR parent IN 1..1 OUTBOUND source
          GRAPH "nestingGraph"
          RETURN parent
        )
        LET children = (
          FOR child IN 1..1 INBOUND source
          GRAPH "nestingGraph"
          RETURN child
        )
        RETURN {source, parents, children, relation, target: DOCUMENT(${'Objects/' + target.id})}
      `
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result: { source: IObject, parents: IObject[], children: IObject[], relation: IRelation }) => {
              const { source: s, relation: r, parents, children } = result;
              if (!s || !r) { // workaround for incomplete data
                return;
              }
              let source = view.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = view.addNode(s._type, s._name, s.id);
                source._domain = s._domain;
                source._isContainer = s._isContainer;
                Object.keys(s).forEach((key) => {
                  if (Property.isProperty(s[key])) {
                    source?.setProperty(key, s[key]);
                  }
                });
                if (parents.length > 0) {
                  source.parentID = parents[0].id;
                }
                if (children) {
                  source.children = children.map((child) => child.id);
                }
                view.getEditor().selectElement(source);
              }
              let edge = view.edges.find((x) => r.id === x.id);
              if (edge === undefined) {
                view.addEdge(r._type, source, target, r._name, r.id);
              }
            })
          })
        });
    }

  expandRelations: (node: ViewNode, filter: Filter, view: ViewModel) => Promise<void> =
    (node, filter, view) => {
      return transaction(() => {
        let promise: Promise<void> = Promise.resolve();
        if (filter.outgoing) {
          promise = this.getRelationsFrom(node, filter, view);
        }
        if (filter.incoming) {
          promise = promise.then(() => this.getRelationsTo(node, filter, view));
        }
        return promise;
      })
    }

  loadModel: (model: ViewModel) => Promise<void> =
    (model) => {
      const aquery = aql`
      FOR source IN Objects
      LET sourceParents = (
        FOR parent IN 1..1 OUTBOUND source
        GRAPH "nestingGraph"
        RETURN parent
      )
      LET sourceChildren = (
        FOR child IN 1..1 INBOUND source
        GRAPH "nestingGraph"
        RETURN child
      )
      FOR target, relation, p IN 1..1 OUTBOUND source
      GRAPH 'objectRelations'
      LET targetParents = (
        FOR parent IN 1..1 OUTBOUND target
        GRAPH "nestingGraph"
        RETURN parent
      )
      LET targetChildren = (
        FOR child IN 1..1 INBOUND target
        GRAPH "nestingGraph"
        RETURN child
      )
      RETURN {source, sourceParents, sourceChildren, relation, target, targetParents, targetChildren}
      `;
      return this.db.query(aquery)
        .then((array) => {
          transaction(() => {
            array.each((result: { source: IObject, sourceParents: IObject[], sourceChildren: IObject[], relation: IRelation, target: IObject, targetParents: IObject[], targetChildren: IObject[] }) => {
              const { source: s, sourceParents, sourceChildren, relation: r, target: t, targetParents, targetChildren } = result;
              let source = model.nodes.find((x) => s.id === x.id);
              if (source === undefined) {
                source = model.addNode(s._type, s._name, s.id);
                source._domain = s._domain;
                source._isContainer = s._isContainer;
                Object.keys(s).forEach((key) => {
                  if (Property.isProperty(s[key])) {
                    source?.setProperty(key, s[key]);
                  }
                });
                if (sourceParents.length > 0) {
                  source.parentID = sourceParents[0].id;
                }
                if (sourceChildren) {
                  source.children = sourceChildren.map((child) => child.id);
                }
              }
              if (t) {
                let target = model.nodes.find((x) => t.id === x.id);
                if (target === undefined) {
                  target = model.addNode(t._type, t._name, t.id);
                  target._domain = t._domain;
                  target._isContainer = t._isContainer;
                  Object.keys(t).forEach((key) => {
                    if (Property.isProperty(t[key])) {
                      target?.setProperty(key, t[key]);
                    }
                  });
                  if (targetParents.length > 0) {
                    target.parentID = targetParents[0].id;
                  }
                  if (targetChildren) {
                    target.children = targetChildren.map((child) => child.id);
                  }
                  }
                let edge = model.edges.find((x) => r.id === x.id);
                if (edge === undefined) {
                  edge = model.addEdge(r._type, source, target, r._type.replace('Relation', ''), r.id);
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