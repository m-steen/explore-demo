import React from 'react';
import { observer } from 'mobx-react';
import { Form, Button, FormProps } from 'react-bootstrap';
import Application from '../model/application';
import Select, { ValueType, ActionMeta } from 'react-select';

export interface IExpandForm extends FormProps {
  editor: Application;
  onSubmit?: React.FormEventHandler<any>;
}

@observer
export class ExpandForm extends React.Component<IExpandForm> {

  handleRelationFilterChange = (options: ValueType<{ value: string, label: string }>, meta: ActionMeta) => {
    if (options instanceof Array) {
      this.props.editor.filter.relations = options.map((option) => option.value);
    }
  }

  handleTypeFilterChange = (options: ValueType<{ value: string, label: string }>, meta: ActionMeta) => {
    if (options instanceof Array) {
      this.props.editor.filter.types = options.map((option) => option.value);
    }
  }

  toggleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filter = this.props.editor.filter;
    const name = e.target.name;
    this.props.editor.filter = { ...filter, [name]: e.target.checked };
  }

  render() {
    const { filter, relationTypes, objectTypes } = this.props.editor;
    const relationFilterOptions = relationTypes.map((relType) => ({ value: relType, label: relType.replace('Relation', '') }));
    const activeRelationFilter = filter.relations.map((relType) => ({ value: relType, label: relType.replace('Relation', '') }));
    const typeFilterOptions =
      objectTypes
        .filter((type) => filter.layers.length === 0 || filter.layers.some((layer) => type.includes(layer)))
        .map((type) => ({ value: type, label: type }));
    const activeTypeFilter = filter.types.map((type) => ({ value: type, label: type }));
    if (this.props.editor.selection.length > 0) {
      return (
        <Form onSubmit={this.props.onSubmit}>
          <Form.Group controlId="relationTypeFilter">
            <Form.Label>Relations to expand on</Form.Label>
            <Select key='relationSelect' styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
              placeholder={'Select relations...'}
              options={relationFilterOptions}
              onChange={this.handleRelationFilterChange}
              value={activeRelationFilter}
              isMulti
              closeMenuOnSelect={true} />
            <Form.Group>
              <Form.Check inline key='outgoingCheckbox' name='outgoing' type='checkbox' label='Outgoing' checked={filter.outgoing} onChange={this.toggleCheckbox} />
              <Form.Check inline key='incomingCheckbox' name='incoming' type='checkbox' label='Incoming' checked={filter.incoming} onChange={this.toggleCheckbox} />
            </Form.Group>
            <Form.Label>Only expand to the following object types...</Form.Label>
            <Select key='typeSelect' styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
              placeholder={'Select types...'}
              options={typeFilterOptions}
              onChange={this.handleTypeFilterChange}
              value={activeTypeFilter}
              isMulti
              closeMenuOnSelect={true} />
          </Form.Group>
          <Button variant="primary" type="submit">Expand</Button>
        </Form>
      );
    } else {
      return <p>Select some objects to expand...</p>;
    }

  }
}
