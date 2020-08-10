import React from 'react';
import { observer } from 'mobx-react';
import { Form, Button, FormProps } from 'react-bootstrap';
import Application from '../model/application';
import Select, { ValueType, ActionMeta } from 'react-select';

export interface IFilterForm extends FormProps {
  appState: Application;
  onSubmit?: React.FormEventHandler<any>;
}

@observer
export class FilterForm extends React.Component<IFilterForm> {

  handleLayerFilterChange = (options: ValueType<{ value: string, label: string }>, meta: ActionMeta) => {
    if (options instanceof Array) {
      this.props.appState.filter.layers = options.map((option) => option.value);
    }
  }

  handleTypeFilterChange = (options: ValueType<{ value: string, label: string }>, meta: ActionMeta) => {
    if (options instanceof Array) {
      this.props.appState.filter.types = options.map((option) => option.value);
    }
  }

  render() {
    const { filter, layers, objectTypes } = this.props.appState;
    const layerFilterOptions = layers.map((layer) => ({ value: layer, label: layer }));
    const activeLayerFilter = filter.layers.map((layer) => ({ value: layer, label: layer }));
    const typeFilterOptions = 
      objectTypes
        .filter((type) => filter.layers.length === 0 || filter.layers.some((layer) => type.includes(layer)))
        .map((type) => ({ value: type, label: type }));
    const activeTypeFilter = filter.types.map((type) => ({ value: type, label: type }));

    return (
      <Form onSubmit={this.props.onSubmit}>
        <Form.Group controlId="filters">
          <Form.Label>Filter on layer</Form.Label>
          <Select key='layerSelect' styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
            placeholder={'Select layers...'}
            options={layerFilterOptions}
            onChange={this.handleLayerFilterChange}
            value={activeLayerFilter}
            isMulti
            closeMenuOnSelect={false} />
          <Form.Label>Filter on type</Form.Label>
          <Select key='typeSelect' styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
            placeholder={'Select types...'}
            options={typeFilterOptions}
            onChange={this.handleTypeFilterChange}
            value={activeTypeFilter}
            isMulti
            closeMenuOnSelect={true} />
        </Form.Group>
        <Button variant="primary" type="submit">Filter</Button>
      </Form>
    )
  }
}
