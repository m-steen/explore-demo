import { observable, action, transaction } from 'mobx';
import Property, { IProperty, ValueType, Money, List, Enum, Structure } from './properties';
import uuid from 'uuid';
import Editor from '../editor/editor';
import { serializable, list, object, identifier, map } from 'serializr';


export type IObject = 
  IDocument & {
    _key?: string;
    _id?: string;
    id: string;
    _name: string;
    _type: string;
    _domain: string;
    _metaModel?: string;
    _kind?: string;
    _isContainer: boolean;
  }


export type IRelation = 
  IObject &
  {
    _from: string;
    _to: string;
  }

export interface IDocument {
  [key: string]: IProperty
}

export class MObject {
  @serializable(identifier())
  id: string;
  @serializable
  @observable _name: string;
  @serializable(map(object(Property)))
  @observable properties: { [name: string]: Property } = {};
  @serializable
  @observable _type: string;
  @serializable
  @observable _domain: string = '';

  _isContainer: boolean = false;
  @observable parentID: string | null = null;
  @observable children: string[] = [];

  constructor(type: string, name?: string, id?: string) {
    this.id = id ? id : uuid();
    this._type = type;
    if (name) {
      this._name = name;
    } else {
      this._name = type;
    }

    const nameProperty: IProperty = {
      name: 'nm',
      label: 'name',
      type: 'string',
      category: 'string',
      value: this._name,
      rawValue: this._name,
    }
    this.setProperty('nm', nameProperty);
  }

  getProperties() {
    return Object.values(this.properties).filter((prop) => Property.isProperty(prop));
  }

  getProperty(name: string) {
    if (this.hasProperty(name)) {
      return this.properties[name];
    } else {
      return undefined;
    }
  }

  hasProperty(name: string) {
    return Object.keys(this.properties).includes(name);
  }

  @action
  setProperty(name: string, property: IProperty) {
    this.properties[name] = new Property(property.name, property.label, property.type, property.category, property.value, property.rawValue);
    return this;
  }

  @action
  addProperties(properties: IProperty[]) {
    properties.forEach((prop) => {
      this.setProperty(prop.name, prop);
    });
    return this;
  }

  getPropertyValue(name: string) {
    if (this.hasProperty(name)) {
      const value = this.properties[name].value;
      const type = this.properties[name].type;
      switch (type) {
        case 'boolean':
          return value as boolean;
        case 'date':
          return value as number;
        case 'money':
          return value as Money;
        case 'number':
          return value as number;
        case 'string':
          return value as string;
      
        default:
          if (Property.isCollection(value)) {
            return value as List;
          }
          if (Property.isStructure(value)) {
            return value as Structure;
          }
          if (Property.isEnum(value)) {
            return value as Enum;
          }
          return value;
      }
    } else {
      return undefined;
    }
  }

  @action
  setPropertyValue(name: string, value: ValueType) {
    if (this.hasProperty(name)) {
      this.properties[name].value = value;
    }
    return this;
  }
}

export class MRelation extends MObject {
  source: MObject;
  target: MObject;

  constructor(type: string, source: MObject, target: MObject, name?: string, id?: string) {
    if (!name) {
      name = type.replace('Relation', '');
    }
    super(type, name, id);
    this.source = source;
    this.target = target;
  }

}

export class MModel {

  @serializable(list(object(MObject)))
  @observable.shallow objects: MObject[] = [];
  @serializable(list(object(MRelation)))
  @observable.shallow relations: MRelation[] = [];

  constructor(readonly editor: Editor) {}

  @action
  addObject(type: string, name?: string, id?: string): MObject {
    const object = new MObject(type, name, id);
    this.objects.push(object);
    return object;
  }

  @action
  addRelation(type: string, source: MObject, target: MObject, name?: string, id?: string): MRelation {
    const relation = new MRelation(type, source, target, name, id);
    this.relations.push(relation);
    return relation;
  }

  @action
  clear() {
    transaction(() => {
      this.editor.clearSelection();
      this.relations = [];
      this.objects = [];
    })
  }

}
