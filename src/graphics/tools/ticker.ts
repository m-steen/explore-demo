import { format } from 'util';

export type Action = () => void;

class Ticker {
  private started: boolean = false;
  private ticks = 0;
  private subscribers = new Map<string, Action>();

  registerAction = (name: string, action: Action) => {
    this.subscribers.set(name, action);
    if (!this.started) {
      this.start();
    }
  }

  unregisterAction = (name: string) => {
    this.subscribers.delete(name);
    if (this.subscribers.size === 0) {
      this.stop();
    }
  }

  start = () => {
    this.ticks = 0;
    this.started = true;
    
    let ticker = () => {
      if (this.started) {
        this.tick();
        window.requestAnimationFrame(ticker);
      }
    }

    ticker();
  }

  stop = () => {
    this.started = false;
    console.log(format('Stopped timer after %s ticks', this.ticks))
  }

  tick = () => {
    this.ticks++;
    this.subscribers.forEach((action) => action());
  }
}

export default Ticker;