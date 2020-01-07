import React from 'react';
import { ButtonToolbar, Container, Row, InputGroup, FormControl } from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import { observer } from 'mobx-react';
import './App.css';
import Application from './model/application';
import Canvas from './graphics/ui/Canvas';
import { ButtonControl, Command } from './graphics/ui/editor-controls';


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
    return (
      <Container className="App">
        <Row>
          <h1>{title}</h1>
        </Row>
        <Row>
          <ButtonToolbar className="p-1">
            <ButtonControl label={'Clear'} command={this.onClear} />
            <ButtonControl label={'Load'} command={this.onLoad} />
            <ButtonControl label={'Layout'} command={this.onLayout} />
            <InputGroup>
              <InputGroup.Prepend><InputGroup.Text>?</InputGroup.Text></InputGroup.Prepend>
              <FormControl id="searchbar" type="text" value={query} onChange={this.onQueryChange} onKeyPress={this.onQuerySubmit} />
            </InputGroup>
          </ButtonToolbar>
        </Row>
        <Row>
          <Canvas view={view} size={{ width: 1000, height: 600 }} />
        </Row>
      </Container>
    );
  }

  onClear: Command = () => new Promise((resolve) => {
    this.appState.view.clear();
    resolve();
  });

  onLoad: Command = () => this.appState.api.loadModel(this.appState.view);

  onLayout: Command = () => this.appState.view.layout.apply();

  onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.appState.query = e.target.value;
  }

  onQuerySubmit = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && this.appState.query.trim().length > 0) {
      this.appState.api.getObjects(this.appState.query, this.appState.view)
      .then(() => this.appState.view.layout.apply());
    }
  }
}

export default App;
