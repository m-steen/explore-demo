import { transaction, reaction } from 'mobx';
import Editor from '../editor/editor';

export class History {
  store: Editor;
  states: any[] = [];
  currentFrame: number = -1;
  changingState: boolean = false;

  constructor(store: Editor) {
    this.store = store;
  }

  startLogging() {
    reaction(() => {
      return [this.store.view.nodes.map((node) => node.id), this.store.view.edges.map((edge) => edge.id)]
    },
      () => {
        if (this.changingState) {
          this.changingState = false;
        } else {
          if (this.currentFrame !== -1) {
            this.states.splice(this.currentFrame + 1);
            this.currentFrame = -1;
          }
          this.states.push(this.store.view.serialize());
        }
      },
      {
        delay: 1000
      });
  }

  previousState() {
    if (this.currentFrame === -1) {
      this.currentFrame = this.states.length - 1;
    }
    if (this.currentFrame > 0) {
      this.currentFrame--;
      this.changingState = true;
      transaction(() =>
        this.store.view.deserialize(this.states[this.currentFrame])
      );
    }
  }

  nextState() {
    if (this.currentFrame > -1 && this.currentFrame < this.states.length - 1) {
      this.currentFrame++;
      this.changingState = true;
      transaction(() =>
        this.store.view.deserialize(this.states[this.currentFrame])
      );
    }
  }
}
