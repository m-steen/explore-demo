import React from 'react';
import { observer } from 'mobx-react';
import { autorun, observable, transaction } from 'mobx';
import { Table } from 'react-bootstrap';
import { GraphicalView, ViewNode } from '../graphics/model/view-model';

export class TableFilter {
  apply: (value: any) => boolean = (value) => true
}

export class TableColumn {
  label: string = '';
  @observable show: boolean = true;
  @observable filter: TableFilter | null = null;

  constructor(public key: string, label?: string) {
    this.label = label ? label : key;
  }
}

export class TableRow {
  isSelected: () => boolean = () => false;
  isVisible: () => boolean = () => true;
  toggleSelection: () => void = () => {};

  constructor(public object: ViewNode) {
    this.isSelected = () => this.object ? (this.object as ViewNode).isSelected : false;
    this.toggleSelection = () => this.object ? this.object.view.toggleSelection(this.object) : {};
  }
}

export class GridModel {
  @observable columns: TableColumn[] = [];
  @observable rows: TableRow[] = [];

  constructor(private view: GraphicalView) {
  }

  disposeUpdateColumns = autorun(() => {
    console.log('Updating columns')
    transaction(() => {
      const properties = this.view.nodes.reduce(
        (properties: string[], node: ViewNode) => {
          return properties.concat(Object.keys(node).filter((key) => !properties.includes(key)))
        },
        ['name']
      );
      this.columns.forEach((col) => {
        if (!properties.includes(col.key)) {
          this.columns.splice(this.columns.indexOf(col), 1);
        }
      });
      properties.forEach((key) => {
        if (this.columns.findIndex((col) => key === col.key) < 0) {
          this.columns.push(new TableColumn(key));
        }
      });
    })
    console.log(this.columns.length)

  })

  disposeUpdateRows = autorun(() => {
    console.log('Updating rows')

    transaction(() => {
      this.rows.forEach((row) => {
        const idx = this.view.nodes.indexOf(row.object);
        if (idx < 0) {
          this.rows.splice(this.rows.indexOf(row), 1);
        }
      });
      this.view.nodes.forEach((obj) => {
        const idx = this.rows.findIndex((row) => obj === row.object);
        if (idx < 0) {
          this.rows.push(new TableRow(obj));
        }
      })
    })
    console.log(this.rows)
  });

}

export interface IPropertyTable {
  view: GraphicalView;
}

export interface IDataTable {
  columns: TableColumn[];
  rows: TableRow[];
}

interface ITableHeader {
  columns: TableColumn[],
  isAllSelected: boolean,
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onColumnClick: (e: React.MouseEvent<HTMLTableHeaderCellElement>) => void
}

const TableHeader = observer((props: ITableHeader ) => {
  return (
    <thead>
      <tr>
        <th><input type='checkbox' checked={props.isAllSelected} onChange={props.onSelectAll} /></th>
        {props.columns.filter((col) => true).map((col) =>
          <th key={col.key} id={col.key} onClick={props.onColumnClick}>{col.label}</th>)}
      </tr>
    </thead>
  )
})

export const DataTable: React.FC<IDataTable> = observer((props) => {

  const toggleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.id) {
      const idx = Number.parseInt(e.target.id);
      const selectedRow = props.rows[idx];
      selectedRow.toggleSelection();
    } else {
      if (e.target.checked) {
        props.rows.forEach((row) => {
          if (!row.isSelected()) {
            row.toggleSelection();
          }
        })
      } else {
        props.rows.forEach((row) => {
          if (row.isSelected()) {
            row.toggleSelection();
          }
        })
      }
    }
  }

  const handleColumnClick = (e: React.MouseEvent<HTMLTableHeaderCellElement>) => {
    const key = e.currentTarget.id;
    console.log(key)
    const column = props.columns.find((col) => key === col.key);
    if (column) {
      column.show = !column.show;
    }

  }

  const { columns, rows } = props;

  return (
    <Table striped bordered hover size="sm" responsive>
      <TableHeader columns={columns} isAllSelected={rows.every((row) => row.isSelected())} onSelectAll={toggleCheckbox} onColumnClick={handleColumnClick} />
      <tbody>
        {rows.filter((row) => row.isVisible()).map((row, idx) =>
          <tr key={idx}>
            <td><input type='checkbox' id={idx.toString()} checked={row.isSelected()} onChange={toggleCheckbox} /></td>
            {columns.filter((col) => true).map((col) =>
              <td key={col.key}>{col.show && row.object? row.object.getProperty(col.key) : ''}</td>)}
          </tr>)}
      </tbody>
    </Table>
  )
});
