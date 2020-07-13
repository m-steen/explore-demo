import { observable, when } from 'mobx';
import { ViewModel } from '../../model/view-model';

export interface ILayout {

  apply: () => void;
  stop: () => void;
  update: () => void;

}

export class BaseLayout {

  @observable protected isLayouting = false;

  constructor(protected view: ViewModel) {
  }

  apply() {
    this.start();
    return when(() => !this.isLayouting);
  };

  private start() {
    console.log('Start layout')
    this.view.getEditor().ticker.registerAction('layout', this.update);
    this.isLayouting = true;
  };

  stop() {
    console.log('Stop layout')
    this.view.getEditor().ticker.unregisterAction('layout');
    this.isLayouting = false;
  };

  protected update = () => {};

}
