import React from 'react';
import { Container, Row, InputGroup, Col, ButtonGroup, Tabs, Tab, Button, Form } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import { observer } from 'mobx-react';
import Select, { ActionMeta, ValueType } from 'react-select';
import './App.css';
import Application from './model/application';
import Canvas from './graphics/ui/Canvas';
import { ViewNode, GraphicalView } from './graphics/model/view-model';
import { TitleBar } from './components/TitleBar';
import { CommandButton, Command } from './components/CommandButton';


@observer
class App extends React.Component {
  appState = new Application('Explore demo');

  constructor(props: any) {
    super(props);
    // Load the model on startup...
    this.appState.api.loadModel(this.appState.view);
  }

  render() {
    const { title, query, view } = this.appState;
    const filterOptions = this.appState.layers.map((layer) => ({ value: layer, label: layer }));
    const activeFilter = this.appState.filter.map((layer) => ({ value: layer, label: layer }));
    return (
      <Container fluid>
        <Row style={{ marginTop: 5, marginBottom: 5 }}>
          <TitleBar title={title} menuItems={[
            { label: 'Share', command: this.onLayout },
            { label: 'Save', command: this.onLayout },
          ]} />
        </Row>
        <Row style={{ marginTop: 5, marginBottom: 5 }}>
          <Col md={4} style={{ borderColor: 'lightgray', borderWidth: 'thin', borderStyle: 'solid' }}>
            <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
              <Tab eventKey="search" title="Search">
                <Form onSubmit={this.onQuerySubmit}>
                  <Form.Group controlId="searchField">
                    <Form.Label>Search on name</Form.Label>
                    <InputGroup>
                      <InputGroup.Prepend><InputGroup.Text>?</InputGroup.Text></InputGroup.Prepend>
                      <Form.Control type="searchbar" placeholder="Find..." value={query} onChange={this.onQueryChange}/>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group controlId="searchFilters">
                    <Form.Label>Filter on types</Form.Label>
                    <Select styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
                      placeholder={'Select types...'}
                      options={filterOptions}
                      onChange={this.handleFilterChange}
                      value={activeFilter}
                      isMulti
                      closeMenuOnSelect={false} />
                  </Form.Group>
                  <Button variant="primary" type="submit">Find</Button>
                </Form>
              </Tab>
              <Tab eventKey="expand" title="Expand">
                <ExpandMenu view={this.appState.view} />
              </Tab>
              <Tab eventKey="filter" title="Filter">
              <Form onSubmit={this.onApplyFilter}>
                  <Form.Group controlId="searchFilters">
                    <Form.Label>Filter on types</Form.Label>
                    <Select styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
                      placeholder={'Select types...'}
                      options={filterOptions}
                      onChange={this.handleFilterChange}
                      value={activeFilter}
                      isMulti
                      closeMenuOnSelect={false} />
                  </Form.Group>
                  <Button variant="primary" type="submit">Apply</Button>
                </Form>
              </Tab>
              <Tab eventKey='more' title='More'>
                <ButtonGroup vertical>
                  <CommandButton label={'Clear'} command={this.onClear} />
                  <CommandButton label={'Load All'} command={this.onLoad} />
                  <CommandButton label={'Layout'} command={this.onLayout} />
                </ButtonGroup>
              </Tab>
            </Tabs>
          </Col>
          <Col md={8}>
            <Row style={{ marginTop: 0, marginBottom: 5 }}>
              <Col style={{ borderColor: 'lightgray', borderWidth: 'thin', borderStyle: 'solid' }}>
                <div style={{ height: 40 }}>{view.selection.filter((e) => e instanceof ViewNode).map((e) => e.label).join(', ')}</div>
              </Col>
            </Row>
            <Row style={{ marginTop: 5, marginBottom: 0 }}>
              <Col style={{ borderColor: 'lightgray', borderWidth: 'thin', borderStyle: 'solid' }}>
                <Canvas view={view} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }

  onClear: Command = () => new Promise((resolve) => {
    this.appState.view.clear();
    resolve();
  });

  onLoad: Command = () => {
    return this.appState.api.loadAll(this.appState.view)
    .then(() => this.appState.view.layout.apply());
  }

  onLayout: Command = () => this.appState.view.layout.apply();

  onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.appState.query = e.target.value;
  }

  onQuerySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = this.appState.query;
    const filter = this.appState.filter;
    const view = this.appState.view;
    this.appState.api.getObjects(query, filter, view)
      .then(() => this.appState.view.layout.apply());
  }

  filter = (eventKey: any, event: any) => {
    console.log(eventKey)
    this.appState.view.nodes.forEach((n) => {
      if (eventKey.includes(n.layer)) {
        console.log(n);
      }
    })
  }

  handleFilterChange = (options: ValueType<{ value: string, label: string }>, meta: ActionMeta) => {
    console.log(options)
    console.log(meta)
    if (options instanceof Array) {
      this.appState.filter = options.map((option) => option.value);
    }
  }

  onApplyFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filter = this.appState.filter;
    if (filter.length === 0) {
      return;
    }
    const view = this.appState.view;
    view.nodes
      .filter((n) => !filter.includes(n.layer))
      .forEach((n) => n.delete());
  }

}

const ExpandMenu: React.FC<{view: GraphicalView}> = observer((props) => {
  const nodeMenu = props.view.nodeMenu();
  const options = nodeMenu.options.map((option) => {
    const action = () => props.view.selection
      .filter((n) => n instanceof ViewNode)
      .map((n) => n as ViewNode)
      .map((n: ViewNode) => option.action(n))
      .reduce((p, f) => p.then(() => f), Promise.resolve());
    return { label:option.label, action: action };
  })
  if (props.view.selection.length > 0) {
    return (
      <ButtonGroup vertical>
        {options.map((option) => {
          return (
            <CommandButton key={option.label} command={option.action} label={option.label} />
          )
        })}
      </ButtonGroup>
    );
    } else {
      return <p>Select some objects to expand...</p>;
    }

})

export default App;
