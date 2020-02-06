import React from 'react';
import { observer } from 'mobx-react';
import { Navbar, Nav, NavbarProps } from 'react-bootstrap';
import { ICommandButton, CommandButton } from './CommandButton';

export interface ITitleBar extends NavbarProps {
  title: string;
  menuItems: ICommandButton[];
}

export const TitleBar: React.FC<ITitleBar> = observer((props) => {
  const variant = props.variant ?? 'dark';
  const bg = props.bg ?? 'secondary';
  return (
    <Navbar variant={variant} bg={bg} style={{ width: '100%' }}>
      <Navbar.Brand>{props.title}</Navbar.Brand>
      <Nav className="mr-auto"></Nav>
      <Nav>
        {props.menuItems.map((item) => 
          <CommandButton key={item.label} label={item.label} command={item.command}/>)}
      </Nav>
    </Navbar>
  );
})

