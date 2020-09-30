import { transaction } from 'mobx';
import { forceSimulation, forceCenter, Simulation, SimulationNodeDatum, SimulationLinkDatum, forceLink, forceCollide, forceY } from 'd3-force';
import { BaseLayout, ILayout } from './layout';

const domainOrdering = ['None', 'Motivation', 'Strategy', 'Business', 'Composite', 'IM', 'Application', 'Technology', 'Physical'];

interface d3Node extends SimulationNodeDatum {
  id: string;
  layer: number;
}

interface d3Link extends SimulationLinkDatum<d3Node> {
  id: string;
  distance: number;
}

export class ForceLayout extends BaseLayout implements ILayout {

  simulation: Simulation<d3Node, d3Link> = forceSimulation<d3Node>().stop();

  apply() {
    console.log('apply force layout')
    const nodes = this.view.nodes.map(
      (node) => {
        return {
          id: node.id,
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
          layer: domainOrdering.indexOf(node._domain),
        }
      })

    const links = this.view.edges.map(
      (edge) => {
        return {
          id: edge.id,
          source: edge.source.id,
          target: edge.target.id,
          distance: 1 + Math.abs(domainOrdering.indexOf(edge.target._domain) - domainOrdering.indexOf(edge.source._domain)),
        }
      }
    );

    this.simulation = forceSimulation<d3Node>(nodes).stop();
    this.simulation.alphaMin(0.1);
    // this.simulation.force('charge', forceManyBody().strength(-10));
    this.simulation.force('collision', forceCollide(50).strength(0.5));
    this.simulation.force('link', forceLink<d3Node, d3Link>(links).id((d) => d.id).distance((l) => 10 * l.distance / Math.max(1, this.view.zoomFactor)));
    this.simulation.force('center', forceCenter(this.view.w / 2, this.view.h / 2));
    this.simulation.force('y', forceY<d3Node>().y((node: d3Node) => 400 * node.layer / Math.max(1, this.view.zoomFactor)).strength(1));
    return super.apply();
  }

  update = () => {
    this.simulation.tick();
    transaction(() => {
      this.simulation.nodes().forEach((n: d3Node) => {
        const node = this.view.nodes.find((node) => n.id === node.id);
        if (node) {
          node.x = n.x ? n.x - node.width / 2 : 0;
          node.y = n.y ? n.y - node.height / 2 : 0;
        }
      })
      this.view.zoomToFit();
    });
    if (this.simulation.alpha() <= this.simulation.alphaMin()) {
      this.simulation.stop();
      this.stop();
    }
  }

}
