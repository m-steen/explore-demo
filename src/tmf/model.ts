import { computed, observable } from "mobx";
import { IProperty, ValueType } from "./properties";
import uuid from "uuid";

export interface IObject {
  id: string;
  type: string;
  layer: string;
  name: string;
}

export interface IRelation extends IObject {
  source: string;
  target: string;
}

export interface IDocument {
  [key: string]: IProperty
}

export class MModel {
  objects: MObject[] = [];

  addObject(type: string, name?: string, id?: string): MObject {
    const object = new MObject(type, name, id);
    this.objects.push(object);
    return object;
  }
}

export class MObject implements IObject {
  id: string;
  @observable properties: { [name: string]: IProperty } = {};
  @observable type: string;
  @observable layer: string = '';
  @computed get name(): string { return Object.keys(this.properties).includes('nm') ? (this.properties['nm'].value as string) : this.id; };

  constructor(type: string, name?: string, id?: string) {
    this.id = id ? id : uuid();
    this.type = type;
    if (!name) {
      name = type;
    }
    const nameProperty: IProperty = {
      name: 'nm',
      label: 'name',
      type: 'string',
      value: name
    }
    this.setProperty('nm', nameProperty);
  }

  getProperties() {
    return Object.entries(this.properties).map(([_name, property]) => property);
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

  setProperty(name: string, property: IProperty) {
    this.properties[name] = property;
    return this;
  }

  addProperties(properties: IProperty[]) {
    properties.forEach((prop) => {
      this.properties[prop.name] = prop;
    });
    return this;
  }

  setPropertyValue(name: string, value: ValueType) {
    if (this.hasProperty(name)) {
      this.properties[name].value = value;
    }
    return this;
  }
}

