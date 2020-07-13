import React, { useState } from 'react';
import { Column, FilterRendererProps } from 'react-data-grid';
import './HeaderFilters.css';
import { MObject } from '../../../model/model';
import { Money } from '../../../model/properties';

enum RuleType {
  Number = 1,
  Range = 2,
  GreaterThan = 3,
  LessThan = 4
}

type Rule =
  | { type: RuleType.Range; begin: number; end: number }
  | { type: RuleType.GreaterThan | RuleType.LessThan | RuleType.Number; value: number };

interface ChangeEvent<R, SR> {
  filterTerm: Rule[] | null;
  column: Column<R, SR>;
  rawValue: string;
  filterValues: typeof filterValues;
}

export function NumericFilter<R, SR>({ value, column, onChange }: FilterRendererProps<R, ChangeEvent<R, SR>, SR>) {
  const [valid, setValid] = useState(true);

  const syntax = new RegExp('^([0-9]+|[<>][0-9]+|[0-9]+-[0-9]+)([,]([0-9]+|[<>][0-9]+|[0-9]+-[0-9]+))*$');

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    let filters: Rule[] = [];
    if (syntax.test(value)) {
      filters = getRules(value);
      setValid(true);
    } else {
      setValid(!value || value.length === 0);
    }
    onChange({
      filterTerm: filters.length > 0 ? filters : null,
      column,
      rawValue: value,
      filterValues
    });
  }

  const tooltipText = 'Input Methods: Range (x-y), Greater Than (>x), Less Than (<y)';

  return (
    <div className="rdg-filter-container">
      <input
        value={value?.rawValue ?? ''}
        className={valid ? "rdg-filter" : "rdg-filter-invalid"}
        placeholder="e.g. 3,10-15,>20"
        onChange={handleChange}
      />
      <span style={{ paddingLeft: 4, cursor: 'help' }} title={tooltipText}>?</span>
    </div>
  );
}


function filterValues(row: MObject, columnFilter: { filterTerm: { [key in string]: Rule } }, columnKey: keyof MObject) {
  if (columnFilter.filterTerm == null) {
    return true;
  }

  // implement default filter logic
  let value: number;
  const prop = row.getProperty(columnKey);
  if (!prop) {
    return true;
  }
  if (prop.type === "number" || prop.type === "date") {
    value = prop.value as number;
  } else if (prop.type === "money") {
    value = (prop.value as Money).amount;
  } else {
    return true;
  }

  for (const ruleKey in columnFilter.filterTerm) {
    const rule = columnFilter.filterTerm[ruleKey];
    switch (rule.type) {
      case RuleType.Number:
        if (rule.value === value) {
          return true;
        }
        break;
      case RuleType.GreaterThan:
        if (rule.value <= value) {
          return true;
        }
        break;
      case RuleType.LessThan:
        if (rule.value >= value) {
          return true;
        }
        break;
      case RuleType.Range:
        if (rule.begin <= value && rule.end >= value) {
          return true;
        }
        break;
      default:
        break;
    }
  }

  return false;
}

export function getRules(value: string): Rule[] {
  if (value === '') {
    return [];
  }

  // handle each value with comma
  return value.split(',').map((str): Rule => {
    // handle dash
    const dashIdx = str.indexOf('-');
    if (dashIdx > 0) {
      const begin = Number(str.slice(0, dashIdx));
      const end = Number(str.slice(dashIdx + 1));
      return { type: RuleType.Range, begin, end };
    }

    // handle greater then
    if (str.includes('>')) {
      const begin = Number(str.slice(str.indexOf('>') + 1));
      return { type: RuleType.GreaterThan, value: begin };
    }

    // handle less then
    if (str.includes('<')) {
      const end = Number(str.slice(str.indexOf('<') + 1));
      return { type: RuleType.LessThan, value: end };
    }

    // handle normal values
    const numericValue = Number(str);
    return { type: RuleType.Number, value: numericValue };
  });
}
