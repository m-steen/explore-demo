import React, { useState, useMemo } from 'react';
import DataGrid, { Column, SelectColumn, SortDirection, HeaderRendererProps, Filters, FilterRendererProps, FormatterProps } from 'react-data-grid';
import 'react-data-grid/dist/react-data-grid.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableHeaderRenderer } from './DraggableHeaderRenderer';
import { NumericFilter } from './filters/NumericFilter';
import './filters/HeaderFilters.css';
import { observer } from 'mobx-react-lite';
import { PropertyEditor } from '../PropertyEditor';
import { MModel, MObject } from '../../model/model';
import Editor from '../../editor/editor';
import Property, { PropertyType, IProperty, Enum, ValueType, Money } from '../../model/properties';
import { DummyNode, EdgeSegment } from '../../model/view-model';

interface ObjectTableProps {
  model: MModel,
  editor: Editor,
}

const compareBooleans: (a: ValueType, b: ValueType) => number = 
  (a, b) => a === b ? 0 : a === true ? 1 : -1

const compareNumbers: (a: ValueType, b: ValueType) => number =
  (a, b) => {
    const _a = a && typeof(a) === "number" ? a : 0;
    const _b = b && typeof(b) === "number" ? b : 0;
    return _a === _b ? 0 : (_a > _b ? 1 : -1);
  }

const compareMoneys: (a: ValueType, b: ValueType) => number =
  (a, b) => {
    const _a = a && Property.isMoney(a) ? a.amount : 0;
    const _b = b && Property.isMoney(b) ? b.amount : 0;
    return compareNumbers(_a, _b);
  }

const compareStrings: (a: ValueType, b: ValueType) => number =
  (a, b) => {
    let left: string;
    if (a && typeof(a) === "string") {
      left = a;
    } else {
      left = '';
    }
    let right: string;
    if (b && typeof(b) === "string") {
      right = b;
    } else {
      right = '';
    }
    return left.localeCompare(right);
  }

interface SummaryRow {
  id: string;
  totalCount: number;
  sum: (key: string) => number;
}

const PropertyFormatter = (props: FormatterProps<MObject, SummaryRow>) => {
  const prop = props.row.properties ? props.row.properties[props.column.key] : null;
  if (prop) {
    return <PropertyEditor property={prop} readOnly={true} />
  } else {
    return null;
  }
}

function StringFilter<R, SR>(props: FilterRendererProps<R, string, SR>) {
  return (
    <div className="rdg-filter-container">
    <input
      className="rdg-filter"
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
    />
  </div>
  )
}

function BooleanFilter<R, SR>(props: FilterRendererProps<R, string, SR>) {
  return (
    <div className="rdg-filter-container">
    <select className="rdg-filter" value={props.value} onChange={e => props.onChange(e.target.value)}>
      <option value="all">All</option>
      <option value="true">yes</option>
      <option value="false">no</option>
    </select>
  </div>
  )
}


function selectFilter(propType: PropertyType) {
  switch (propType) {
    case "boolean":
      return BooleanFilter;
    case "number":
    case "money":
    case "date":
      return NumericFilter;
    case "string":
      return StringFilter;

    default:
      if (Array.isArray(propType)) {
        return StringFilter;
      }
      if (typeof(propType) === 'object') {
        return StringFilter;
      }
      break;
  }
}

const applyPropertyFilters = (row: MObject, filters: Filters) => {
  const filterKeys = Object.keys(filters);
  return (
    filterKeys.every((key) => {
      if (key === 'type' || key === 'name') {
        return row[key].length >= filters[key].length && row[key].toLowerCase().includes(filters[key].toLowerCase());
      }
      const prop = row.getProperty(key);
      switch (prop?.type) {
        case "boolean":
          return (
            filters[key] === 'all'
            || (filters[key] === 'true' ? (prop.value as boolean) : !(prop.value as boolean))
          );
        case "string":
          return (prop.value as string).length >= filters[key].length && (prop.value as string).toLowerCase().includes(filters[key].toLowerCase());
        case "number":
        case "money":
          return filters[key].filterValues(row, filters[key], key);
        default:
          return true;
      }
    }
  )
  )
}

function createColumns(objects: MObject[]): Column<MObject, SummaryRow>[] {
  const columns: Column<MObject, SummaryRow>[] = [
    SelectColumn,
    {
      key: 'id',
      name: 'ID',
      resizable: true,
      sortable: true,
      summaryFormatter() {
        return <strong>Total</strong>;
      }
    },
    {
      key: 'type',
      name: 'Type',
      resizable: true,
      sortable: true,
      filterRenderer: StringFilter,
      summaryFormatter({ row }) {
        return <>{row.totalCount} objects</>;
      }
    },
    {
      key: 'nm',
      name: 'Name',
      resizable: true,
      sortable: true,
      formatter: PropertyFormatter,
      filterRenderer: StringFilter
    }
  ];

  return columns;
}

function EmptyRowsRenderer() {
  return <div style={{ textAlign: 'center' }}>Nothing to show ...</div>;
}


const ObjectTable: React.FC<ObjectTableProps> = observer((props) => {
  console.log('rendering ObjectTable')
  const { objects, relations } = props.model;
  const elements = objects.concat(relations).filter((obj) => !(obj instanceof DummyNode) && !(obj instanceof EdgeSegment));
  const { selection } = props.editor;
  const [columns, setColumns] = useState(createColumns(elements));

  const selectedRows = new Set(selection);
  const [[sortColumn, sortDirection], setSort] = useState<[string, SortDirection]>(['id', 'NONE']);

  const [filters, setFilters] = useState<Filters>({
    nm: '',
    });
  const [enableFilters, setEnableFilters] = useState(false);

  const properties = useMemo(() =>
    elements.reduce(
      (properties: IProperty[], obj: MObject) => properties.concat(obj.getProperties()),
      []
    ), [elements]);
  const availableProperties = useMemo(() =>
    properties.filter((prop: IProperty) => columns.findIndex((col) => prop.name === col.key) === -1),
    [properties, columns]
  );

  const draggableColumns = useMemo(() => {

    function removeColumn(key: string) {
      const columnIdx = columns.findIndex(c => key === c.key);
      const newColumns = [...columns];
      newColumns.splice(columnIdx, 1);
      setColumns(newColumns);
    }

    function insertColumn(sourceKey: string, targetKey: string) {
      if (elements.length < 1) {
        return;
      }

      const columnProp = properties.find((prop) => sourceKey === prop.name);

      if (columnProp) {
        const newColumn: Column<MObject, SummaryRow> = {
          key: columnProp.name,
          name: columnProp.label,
          resizable: true,
          sortable: true,
          formatter: PropertyFormatter,
          filterRenderer: selectFilter(columnProp.type),
        }
        const newColumns = [...columns];
        newColumns.push(newColumn);
        setColumns(newColumns);
        handleColumnsReorder(sourceKey, targetKey);
      }
    }

    function handleColumnsReorder(sourceKey: string, targetKey: string) {
      const sourceColumnIndex = columns.findIndex(c => c.key === sourceKey);
      const targetColumnIndex = columns.findIndex(c => c.key === targetKey);
      const reorderedColumns = [...columns];

      reorderedColumns.splice(
        targetColumnIndex,
        0,
        reorderedColumns.splice(sourceColumnIndex, 1)[0]
      );

      setColumns(reorderedColumns);
    }

    function HeaderRenderer(props: HeaderRendererProps<MObject>) {
      return <DraggableHeaderRenderer {...props} onColumnsReorder={handleColumnsReorder} onDropProperty={insertColumn} removeColumn={removeColumn} />;
    }

    return columns.map(c => {
      return c.key === 'select-row' ? c : { ...c, headerRenderer: HeaderRenderer };
    });
  }, [columns, elements, properties]);

  const filteredRows: readonly MObject[] = elements.filter((row) => (
    (filters.name && filters.name.length > 0 ? row.name.toLowerCase().includes(filters.name.toLowerCase()) : true)
    && applyPropertyFilters(row, filters)
  ));

  const sortedRows: readonly MObject[] = useMemo(() => {
    if (sortDirection === 'NONE') return filteredRows;

    let sortedRows = [...filteredRows];

    switch (sortColumn) {
      case 'id':
        sortedRows = sortedRows.sort((a, b) => a[sortColumn].localeCompare(b[sortColumn]));
        break;
      case 'type':
        sortedRows = sortedRows.sort((a, b) => a[sortColumn].localeCompare(b[sortColumn]));
        break;
      default:
        const prop = properties.find((prop) => sortColumn === prop.name);
        if (prop) {
          switch (prop.type) {
            case "boolean":
              sortedRows = sortedRows.sort((a, b) => compareBooleans(a.getPropertyValue(sortColumn), b.getPropertyValue(sortColumn)));
              break;
            case "string":
              sortedRows = sortedRows.sort((a, b) => compareStrings(a.getPropertyValue(sortColumn), b.getPropertyValue(sortColumn)));
              break;
            case "number":
              sortedRows = sortedRows.sort((a, b) => compareNumbers(a.getPropertyValue(sortColumn), b.getPropertyValue(sortColumn)));
              break;
            case "money":
              sortedRows = sortedRows.sort((a, b) => compareMoneys(a.getPropertyValue(sortColumn), b.getPropertyValue(sortColumn)));
              break;
            case "date":
              sortedRows = sortedRows.sort((a, b) => compareNumbers(a.getPropertyValue(sortColumn), b.getPropertyValue(sortColumn)));
              break;
            default:
              if (Property.isEnum(prop.type)) {
                sortedRows = sortedRows.sort((a, b) => compareStrings((a.getPropertyValue(sortColumn) as Enum)?.name, (b.getPropertyValue(sortColumn) as Enum)?.name));
              }
              break;
          }
        }
    }

    return sortDirection === 'DESC' ? sortedRows.reverse() : sortedRows;
  }, [filteredRows, properties, sortColumn, sortDirection]);

  const summaryRows = useMemo(() => {
    const summaryRow: SummaryRow = { id: 'total_0', totalCount: filteredRows.length, 
      sum: (key: string) => filteredRows.reduce((_sum, obj) => {
        const prop = obj.getProperty(key);
        if (prop && prop.type === "number") {
          _sum += prop.value as number;
        }
        if (prop && prop.type === "money") {
          _sum += (prop.value as Money).amount;
        }
        return _sum;
      },
      0
      ) };
    return [summaryRow];
  }, [filteredRows]);

  const handleSort = (columnKey: string, direction: SortDirection) => {
    setSort([columnKey, direction]);
  };

  function toggleFilters() {
    clearFilters();
    setEnableFilters(!enableFilters);
  }

  function clearFilters() {
    setFilters({
      nm: '',
    });
  }

  function handleAddColumn() {
    if (availableProperties.length < 1) return;

    const columnProp = availableProperties[0];

    const newColumn: Column<MObject, SummaryRow> = {
      key: columnProp.name,
      name: columnProp.label,
      resizable: true,
      sortable: true,
      formatter: PropertyFormatter,
      filterRenderer: selectFilter(columnProp.type),
      summaryFormatter: (props) => { 
        let sum: ValueType;
        const _sum = props.row.sum(props.column.key);
        if (columnProp.type === "money") {
          sum = { currency: 'USD', amount: _sum };
        } else {
          sum = _sum;
        }
        if (_sum !== 0) {
          return <PropertyEditor property={{name: 'sum', label: 'sum', type: columnProp.type, value: sum}} readOnly={true} />;
        } else {
          return null;
        }
      }
    }
    const newColumns = [...columns];
    newColumns.push(newColumn);
    setColumns(newColumns);
  }

  return (
    <div>
      <div style={{ marginBottom: 10, textAlign: 'right' }}>
        <button type="button" onClick={handleAddColumn}>Add Column</button>{' '}
        <button type="button" onClick={toggleFilters}>Toggle Filters</button>{' '}
        <button type="button" onClick={clearFilters}>Clear Filters</button>
      </div>
      <DndProvider backend={HTML5Backend}>
        <DataGrid
          height={600}
          columns={draggableColumns}
          rows={sortedRows}
          rowKey='id'
          selectedRows={selectedRows}
          onSelectedRowsChange={(selectedRows) => {
            props.editor.setSelection(Array.from(selectedRows));
          }}
          enableFilters={enableFilters}
          filters={filters}
          onFiltersChange={setFilters}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyRowsRenderer={EmptyRowsRenderer}
          summaryRows={summaryRows}
        />
      </DndProvider>
    </div>
  );

})

export default ObjectTable;
