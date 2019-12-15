import { GraphicalView } from "../model/view-model";
import { observable, when } from "mobx";

export interface ILayout {

  apply: () => void;
  stop: () => void;
  update: () => void;

}

export class BaseLayout {
  @observable protected isLayouting = false;

  constructor(protected view: GraphicalView) {}

  apply() {
    this.start();
    return when(() => !this.isLayouting);
  };

  private start() {
    this.view.ticker.registerAction('layout', this.update);
    this.isLayouting = true;
  };

  stop() {
    this.view.ticker.unregisterAction('layout');
    this.isLayouting = false;
  };

  protected update = () => {};

}
