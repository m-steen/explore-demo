import { observable, action, transaction } from 'mobx';
import Property, { IProperty, ValueType, Money, List, Enum, Structure } from './properties';
import uuid from 'uuid';
import Editor from '../editor/editor';
import { serializable, list, object, identifier, map } from 'serializr';

export interface IObject {
  id: string;
  type: string;
  layer: string;
  name: string;
  properties: { [name: string]: IProperty }
}

export interface IRelation extends IObject {
  source: string;
  target: string;
}

export interface IDocument {
  [key: string]: IProperty
}

export class MObject implements IObject {
  @serializable(identifier())
  id: string;
  @serializable
  @observable name: string;
  @serializable(map(object(Property)))
  @observable properties: { [name: string]: Property } = {};
  @serializable
  @observable type: string;
  @serializable
  @observable layer: string = '';
  // @computed get name(): string { return Object.keys(this.properties).includes('nm') ? (this.properties['nm'].value as string) : this.id; };
  @observable parent: MObject | null = null;
  @observable children: MObject[] = [];

  constructor(type: string, name?: string, id?: string) {
    this.id = id ? id : uuid();
    this.type = type;
    if (name) {
      this.name = name;
    } else {
      this.name = type;
    }

    const nameProperty: IProperty = {
      name: 'nm',
      label: 'name',
      type: 'string',
      value: this.name
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
    this.properties[name] = new Property(property.name, property.label, property.type, property.value);
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

  constructor(protected editor: Editor) {}

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
