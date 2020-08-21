import React from 'react';
import { Container, Row, Col, ButtonGroup, Tabs, Tab } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import './index.css';
import { observer } from 'mobx-react';
import { transaction } from 'mobx';
import Application from './model/application';
import { TitleBar } from './wmf/components/TitleBar';
import { CommandButton, Command } from './wmf/components/CommandButton';
import { SearchForm } from './components/SearchForm';
import { ExpandForm } from './components/ExpandMenu';
import Diagram from './wmf/components/diagram/Diagram';
import ObjectTable from './wmf/components/data-grid/ObjectTable';
import { PropertySheet } from './wmf/components/PropertySheet';
import { ViewNode } from './wmf/model/view-model';
import { Login } from './components/Login';
import { SelectForm } from './components/SelectForm';
import { MObject } from './wmf/model/model';
import { TreeView } from './wmf/components/tree-view/TreeView';

@observer
class App extends React.Component {
  editor = new Application('Explore demo');

  // constructor(props: any) {
  //   super(props);
  //   // Load the model on startup...
  //   this.editor.initTestModel();
  // }

  render() {
    const { title, view } = this.editor;

    return (
      <>
      <Login editor={this.editor}/>
      <Container fluid>
        <Row style={{ marginTop: 5, marginBottom: 5 }}>
          <TitleBar title={title} menuItems={[
            { label: 'Undo', command: this.onUndo },
            { label: 'Redo', command: this.onRedo },
            { label: 'Load', command: this.onLoad },
            { label: 'Save', command: this.onSave },
          ]} />
        </Row>
        <Row style={{ marginTop: 5, marginBottom: 5 }}>
          <Col md={4} style={{ borderColor: 'lightgray', borderWidth: 'thin', borderStyle: 'solid' }}>
            <Tabs defaultActiveKey="search" id="uncontrolled-task-tabs" mountOnEnter unmountOnExit>
              <Tab eventKey="search" title="Search">
                <SearchForm appState={this.editor} onSubmit={this.onQuerySubmit} onClear={this.onClear} />
              </Tab>
              <Tab eventKey="select" title="Select">
                <SelectForm editor={this.editor} onSubmit={this.onSelectSubmit} onClear={this.onClearSelection} />
              </Tab>
              <Tab eventKey="expand" title="Expand">
                <ExpandForm editor={this.editor} onSubmit={this.onExpandSubmit} />
              </Tab>
              <Tab eventKey="properties" title="Properties">
                <PropertySheet model={this.editor.view} editor={this.editor} />
              </Tab>
              <Tab eventKey='more' title='More'>
                <ButtonGroup vertical>
                  <CommandButton label={'Clear'} command={this.onClear} />
                  <CommandButton label={'Load All'} command={this.onLoadAll} />
                  <CommandButton label={'Layout'} command={this.onLayout} />
                </ButtonGroup>
              </Tab>
            </Tabs>
          </Col>
          <Col md={8}>
            <Tabs id="content-views" mountOnEnter>
              <Tab eventKey="graph" title="Graph">
                <Diagram view={view} />
              </Tab>
              <Tab eventKey="table" title="Table">
                <ObjectTable model={view} editor={this.editor} onExploreObject={this.onExploreObject} />
              </Tab>
              <Tab eventKey="tree" title="Tree">
                <TreeView model={view} />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
      </>
    );
  }

  onClear: Command = () => new Promise((resolve) => {
    this.editor.view.clear();
    resolve();
  });

  onLoadAll: Command = () => {
    return this.editor.loadModel()
      .then(() => this.editor.view.layout.apply());
  }

  onLoad: Command = () => {
    return new Promise<void>((resolve) => {
      const storedModel = localStorage.getItem('explore model');
      if (storedModel) {
        const json = JSON.parse(storedModel);
        const view = this.editor.view;
        view.deserialize(json);
      }
      resolve();
    })
  }

  onSave: Command = () => {
    return new Promise<void>((resolve) => {
      const json = this.editor.view.serialize();
      console.log(json)
      localStorage.setItem('explore model', JSON.stringify(json));
      resolve();
    })
  }

  onUndo: Command = () => {
    return new Promise<void>((resolve) => {
      this.editor.history.previousState();
      resolve();
    })
  }

  onRedo: Command = () => {
    return new Promise<void>((resolve) => {
      this.editor.history.nextState();
      resolve();
    })
  }

  onLayout: Command = () => this.editor.view.layout.apply();

  onQuerySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = this.editor.query;
    const filter = this.editor.filter;
    const view = this.editor.view;
    transaction(() => {
      this.editor.getObjects(query, filter)
      .then(() => {
        this.editor.resetFilters();
        view.layout.apply();
      });
    })
  }

  onSelectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = this.editor.query;
    const filter = this.editor.filter;
    const view = this.editor.view;
    transaction(() => {
      this.editor.clearSelection();
      view.nodes.forEach((node) => {
        let match;
        if (query.length > 0) {
          const queryMatch = node.name.toLowerCase().includes(query.toLowerCase());
          match = match ? match && queryMatch : queryMatch;
        }
        if (filter.layers.length > 0) {
          const layerMatch = filter.layers.includes(node.layer);
          match = match ? match && layerMatch : layerMatch;
        }
        if (filter.types.length > 0) {
          const typeMatch = filter.types.includes(node.type);
          match = match ? match && typeMatch : typeMatch;
        }
        if (match) {
          this.editor.selectElement(node);
          this.editor.resetFilters();
        }
      });
    });
  }

  onClearSelection: Command = () => new Promise((resolve) => {
    this.editor.clearSelection();
    this.editor.resetFilters();
    resolve();
  });

  onExpandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const view = this.editor.view;
    const filter = this.editor.filter;
    // reset the layer filter
    filter.layers = [];
    // deselect any relations
    view.edges.filter((edge) => edge.isSelected).forEach((edge) => this.editor.toggleSelection(edge));
    // remember the current selection
    const currentSelection: ViewNode[] = [...view.nodes.filter((node) => node.isSelected)];
    transaction(() => {
      Promise.all(
        currentSelection.map((node) => {
          return this.editor.repository.expandRelations(node, filter, view);
        })
      )
        // then deselect the original selection and layout the result
        .then(() => {
          currentSelection.forEach((node) => this.editor.toggleSelection(node));
          this.editor.resetFilters();
          this.editor.view.layout.apply();
        });
    });
  }

  onExploreObject = (e: React.MouseEvent<HTMLDivElement>, object: MObject) => {
    this.editor.clearSelection();
    const view = this.editor.view;
    view.relations = [];
    view.objects = [object];
    this.editor.filter = { layers: [], types: [], relations: [], outgoing: true, incoming: true };
    this.editor.repository.expandRelations(object as ViewNode, this.editor.filter, this.editor.view)
      .then(() => view.layout.apply());
  }

}

export default App;
