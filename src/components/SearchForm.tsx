import React from 'react';
import { observer } from 'mobx-react';
import { Form, InputGroup, Button, FormProps } from 'react-bootstrap';
import Application from '../model/application';
import Select, { ValueType, ActionMeta } from 'react-select';
import { CommandButton, Command } from '../wmf/components/CommandButton';

export interface ISearchForm extends FormProps {
  appState: Application;
  onSubmit?: React.FormEventHandler<any>;
  onClear: Command;
}

@observer
export class SearchForm extends React.Component<ISearchForm> {

  onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.appState.query = e.target.value;
  }

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
    const { query, filter, layers, objectTypes } = this.props.appState;
    const layerFilterOptions = layers.map((layer) => ({ value: layer, label: layer }));
    const activeLayerFilter = filter.layers.map((layer) => ({ value: layer, label: layer }));
    const typeFilterOptions = 
      objectTypes
        .filter((type) => filter.layers.length === 0 || filter.layers.some((layer) => type.includes(layer)))
        .map((type) => ({ value: type, label: type }));
    const activeTypeFilter = filter.types.map((type) => ({ value: type, label: type }));

    return (
      <Form onSubmit={this.props.onSubmit}>
        <Form.Group controlId="searchField">
          <Form.Label>Search on name</Form.Label>
          <InputGroup>
            <InputGroup.Prepend><InputGroup.Text>?</InputGroup.Text></InputGroup.Prepend>
            <Form.Control type="searchbar" placeholder="Find..." value={query} onChange={this.onQueryChange} />
          </InputGroup>
        </Form.Group>

        <Form.Group controlId="searchFilters">
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
        <CommandButton label={'Clear'} command={this.props.onClear} />
        <Button variant="primary" type="submit">Add</Button>
      </Form>
    )
  }
}
