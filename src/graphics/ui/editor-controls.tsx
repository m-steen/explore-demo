import React from 'react';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { Button } from 'react-bootstrap';

export type Command = () => Promise<void>;

const noop = () => {};

interface IButton {
  label: string;
  command: Command;
}

@observer
export class ButtonControl extends React.Component<IButton> {
  @observable isActive: boolean = false;

  @action
  setActive(newState: boolean) {
    this.isActive = newState;
  }

  render() {
    return (
      <Button className="mr-1"
        variant="primary"
        disabled={this.isActive}
        onClick={!this.isActive ? this.handleClick : noop}
      >
        {this.isActive ? ' ... ' : this.props.label}
      </Button>
    );
  }

  handleClick = () => {
    this.setActive(true);
    this.props.command()
      .then(() => {
        this.setActive(false);
      })
  }
}
