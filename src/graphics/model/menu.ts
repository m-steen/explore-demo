import { ViewElement } from "./view-model";

export class Menu<E extends ViewElement> {
  active = false;
  options: MenuOption<E>[] = [];
}

export class MenuOption<E extends ViewElement> {
  label: string = 'Option';
  action: (element: E) => void;

  constructor(label: string, action: (element: E) => void) {
    this.label = label;
    this.action = action;
  }
}
