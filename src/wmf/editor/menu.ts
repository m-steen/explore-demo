import { Command } from '../components/CommandButton';
import { MObject } from '../model/model';

export class Menu<E extends MObject> {
  active = false;
  options: MenuOption<E>[] = [];
}

export class MenuOption<E extends MObject> {
  label: string = 'Option';
  action: Command;

  constructor(label: string, action: Command) {
    this.label = label;
    this.action = action;
  }
}
