import { transaction } from 'mobx';
import { forceSimulation, forceCenter, SimulationNodeDatum, SimulationLinkDatum, forceManyBody, forceLink, forceCollide } from 'd3-force';
import { BaseLayout, ILayout } from './layout';

interface d3Node extends SimulationNodeDatum {
  id: string;
}

interface d3Link extends SimulationLinkDatum<d3Node> {
  id: string;
}

export class ForceLayout extends BaseLayout implements ILayout {

  simulation: any /* Simulation<SimulationNodeDatum, SimulationLinkDatum<SimulationNodeDatum>> */ = forceSimulation().stop();

  apply() {
    console.log('apply force layout')
    const nodes = this.view.nodes.map(
      (node) => {
        return {
          id: node.id,
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
        }
      })

    const links = this.view.edges.map(
      (edge) => {
        return {
          id: edge.id,
          source: edge.source.id,
          target: edge.target.id,
        }
      }
    );

    this.simulation = forceSimulation(nodes).stop();
    this.simulation.alphaMin(0.1);
    this.simulation.force('charge', forceManyBody().strength(-10));
    this.simulation.force('collision', forceCollide(100).strength(1));
    this.simulation.force('link', forceLink(links).id((d) => (d as d3Node).id).strength(0.1));
    this.simulation.force('center', forceCenter(this.view.w / 2, this.view.h / 2));
    return super.apply();
  }

  update = () => {
    // console.log('Update Force layout', this.simulation.alpha())
    this.simulation.tick();
    transaction(() =>
      this.simulation.nodes().forEach((n: d3Node) => {
        const node = this.view.nodes.find((node) => n.id === node.id);
        if (node) {
          node.x = n.x ? n.x - node.width / 2 : 0;
          node.y = n.y ? n.y - node.height / 2 : 0;
        }
      })
    )
    if (this.simulation.alpha() <= this.simulation.alphaMin()) {
      this.simulation.stop();
      this.stop();
    }
  }

}
