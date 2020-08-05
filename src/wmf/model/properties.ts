export type PropertyType = 'boolean' | 'number' | 'string' | 'enum' | 'date' | 'money' | PropertyType[] | { [field: string]: PropertyType };

export type Money = { currency: string, amount: number };
export type List = ValueType[];
export type Structure = { [field: string]: ValueType };
export type Enum = { name: string, value: string };

export type ValueType = undefined | boolean | number | string | Money | List | Structure | Enum;

export interface IProperty {
  name: string;
  label: string;
  type: PropertyType;
  value: ValueType;
}

class Property implements IProperty {

  constructor(public name: string, public label: string, public type: PropertyType, public value: ValueType) { }

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
    return this.isStructure(value) && ['currency', 'amount'] === Object.keys(value)
  }
}

export default Property;
