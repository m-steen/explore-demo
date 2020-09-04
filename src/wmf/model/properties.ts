import { serializable, custom } from 'serializr';

export type PropertyType = 'boolean' | 'number' | 'string' | 'rtf' | 'enum' | 'date' | 'money' | PropertyType[] | { [field: string]: PropertyType };

export type Money = { currency: string, amount: number };
export type List = ValueType[];
export type Structure = { [field: string]: ValueType };
export type Enum = { name: string, value: string };

export type ValueType = undefined | boolean | number | string | Money | List | Structure | Enum;

export interface IProperty {
  name: string;
  label: string;
  type: PropertyType;
  category: string;
  value: ValueType;
  rawValue: any;
}

function serializePropertyType(value: PropertyType): any {
  switch (value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'rtf':
    case 'enum':
    case 'date':
    case 'money':
    case 'link':
      return value;

    default:
      if (value instanceof Array) {
        return [ serializePropertyType(value[0]) ];
      }
      if (value instanceof Object) {
        const entries = Object.entries(value).map(([key, val]) => ([key, serializePropertyType(val)]));
        const structure: any = {};
        entries.forEach(([key, val]) => {
          structure[key] = val;
        });
        return structure;
      }
  }
}

function deserializePropertyType(json: any): PropertyType {
  return 'boolean';
}

function serializeValue(value: ValueType): any {
  switch (typeof (value)) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
      return value;

    default:
      if (Property.isMoney(value) || Property.isEnum(value)) {
        return value;
      } else if (Property.isCollection(value)) {
        return value.map((element) => serializeValue(element));
      } else if (Property.isStructure(value)) {
        const entries = Object.entries(value).map(([key, val]) => ([key, serializeValue(val)]));
        const structure: any = {};
        entries.forEach(([key, val]) => {
          structure[key] = val;
        });
        return structure;
      }
      console.log('Cannot serialize: ', value)
      return {};
  }
}

function deserializeValue(json: any): ValueType {
  return undefined;
}

class Property implements IProperty {

  @serializable
  name: string;
  @serializable
  label: string;
  @serializable(custom(serializePropertyType, deserializePropertyType))
  type: PropertyType;
  category: string;
  @serializable(custom(serializeValue, deserializeValue))
  value: ValueType;
  rawValue: any;

  constructor(name: string, label: string, type: PropertyType, category: string, value: ValueType, rawValue: any) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.category = category;
    this.value = value;
    this.rawValue = rawValue;
  }

  static isProperty(prop: Object): prop is IProperty {
    if ((prop as IProperty).type && (prop as IProperty).value) {
      return true;
    }
    return false;
  }

  static isCollectionType(type: PropertyType): type is PropertyType[] {
    return Array.isArray(type);
  }

  static isCollection(value: ValueType): value is List {
    return Array.isArray(value);
  }

  static isStructure(value: ValueType): value is Structure {
    return !this.isCollection(value) && (value instanceof Object);
  }

  static isEnum(value: ValueType): value is Enum {
    return this.isStructure(value) && Object.keys(value).includes('name');
  }

  static isMoney(value: ValueType): value is Money {
    const keys = this.isStructure(value) ? Object.keys(value) : [];
    return keys.includes('currency') && keys.includes('amount')
  }
}

export default Property;
