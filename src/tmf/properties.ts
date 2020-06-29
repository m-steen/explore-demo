export type PropertyType = 'boolean' | 'number' | 'string' | 'date' | 'money' | PropertyType[] | { [field: string]: PropertyType };

export type Money = { currency: string, amount: number };
export type List = ValueType[];
export type Structure = { [field: string]: ValueType };

export type ValueType = undefined | boolean | number | string | Money | List | Structure;

export interface IProperty {
  name: string;
  label: string;
  type: PropertyType;
  value: ValueType;
}
