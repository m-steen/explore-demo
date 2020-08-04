import React from 'react';
import { observer } from 'mobx-react-lite';
import Property, { IProperty, Money, ValueType } from '../model/properties';

interface PropertyEditorProps {
  property: IProperty,
  readOnly: boolean,
}

const numberFormatter = new Intl.NumberFormat(navigator.language, {
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat(navigator.language);

function stringifyPropValue(property: IProperty): string {
  switch (property.type) {
    case "boolean":
      return property.value as boolean ? '✔️' : '❌';
    case "number":
      return numberFormatter.format(property.value as number);
    case "string":
      return property.value as string;
    case "rtf": {
        var rtf = (property.value as string).replace(/\\par[d]?/g, "");
        rtf = rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "")
        return rtf.replace(/\\'[0-9a-zA-Z]{2}/g, "").trim();
    }
    case "date":
      return dateFormatter.format(property.value as number);
    case "money":
      const currencyFormatter = new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: (property.value as Money).currency
      });
      return currencyFormatter.format((property.value as Money).amount);
    
    default: {
      if (Property.isCollectionType(property.type)) {
        const elementType = property.type[0];
        return (property.value as ValueType[]).map((val) => stringifyPropValue(new Property('element', 'element', elementType, val))).join(', ');
      }
      if (Property.isEnum(property.value)) {
        return property.value.name;
      }
      console.log('Unknown property type: ' + property.type, property)
      return property.value?.toString() || '';
    }
  }
}

export const PropertyEditor: React.FC<PropertyEditorProps> = observer((props) => {
  const { property, readOnly } = props;
  const value: string = stringifyPropValue(property);

  return (
    readOnly ? 
      <div>{value}</div>
      : <input value={value} onChange={() => {}}/>
  );
});
