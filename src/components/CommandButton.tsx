import React from 'react';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { Button, ButtonProps } from 'react-bootstrap';

export type Command = (element?: any) => Promise<void>;

const noop = () => {};

export interface ICommandButton extends ButtonProps {
  label: string;
  command: Command;
  className?: string;
}

@observer
export class CommandButton extends React.Component<ICommandButton> {
  @observable isActive: boolean = false;

  @action
  setActive(newState: boolean) {
    this.isActive = newState;
  }

  render() {
    const variant = this.props.variant ?? 'primary';
    const className = this.props.className ?? 'mr-1';
    return (
      <Button className={className}
        variant={variant}
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
