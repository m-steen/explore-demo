
export class Menu {
  active = false;
  options: MenuOption[] = [];
}

export class MenuOption {
  label: string = 'Option';
  action = () => {};

  constructor(label: string, action: () => void) {
    this.label = label;
    this.action = action;
  }
}
