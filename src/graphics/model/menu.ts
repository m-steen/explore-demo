import { ViewElement } from "./view-model";
import { Command } from "../../components/CommandButton";

export class Menu<E extends ViewElement> {
  active = false;
  options: MenuOption<E>[] = [];
}

export class MenuOption<E extends ViewElement> {
  label: string = 'Option';
  action: Command;

  constructor(label: string, action: Command) {
    this.label = label;
    this.action = action;
  }
}
