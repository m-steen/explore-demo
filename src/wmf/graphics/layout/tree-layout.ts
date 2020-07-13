import { BaseLayout, ILayout } from './layout';


export class TreeLayout extends BaseLayout implements ILayout {

  update = () => {
    const avgX = this.view.nodes.reduce((sum, n) => sum + n.x, 0) / this.view.nodes.length;
    let maxDelta = 0;
    this.view.nodes.forEach((n) => {
      const delta = n.x - avgX;
      maxDelta = Math.max(maxDelta, delta);
      n.x -= Math.floor(delta * 0.02);
    })
    if (Math.abs(maxDelta) < 0.1) {
      this.stop();
    }
  }

}
