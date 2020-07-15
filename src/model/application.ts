import { observable } from 'mobx';
import { Menu, MenuOption } from '../wmf/editor/menu';
import { Command } from '../wmf/components/CommandButton';
import Editor from '../wmf/editor/editor';
import ArangoRepository from '../wmf/repository/arango-repository';
import { ViewNode } from '../wmf/model/view-model';

const colorScheme: Map<string, string> = new Map([
  ['Strategy', '#FFC685'],
  ['Motivation', '#D7CFFF'],
  ['Business', '#FAF087'],
  ['Application', '#B8E7FC'],
  ['Technology', '#D6F8B8'],
  ['Physical', '#D6F8B8'],
  ['Composite', '#ffb372'],
  ['IM', '#FFBDDC'],
  ['', '#D6F8B8'],
]);

export interface Filter {
  layers: string[];
  types: string[];
  relations: string[];
  outgoing: boolean;
  incoming: boolean;
}

class Application extends Editor {
  @observable title: string = '';
  @observable query: string = '';
  layers = Array.from(colorScheme.keys()).filter((key) => key.length > 0);
  objectTypes = [
    'ApplicationCollaboration',
    'ApplicationComponent',
    'ApplicationDataObject',
    'ApplicationEvent',
    'ApplicationFunction',
    'ApplicationInteraction',
    'ApplicationInterface',
    'ApplicationProcess',
    'ApplicationService',
    'BusinessActivity',
    'BusinessActor',
    'BusinessCollaboration',
    'BusinessContract',
    'BusinessEvent',
    'BusinessFunction',
    'BusinessInteraction',
    'BusinessInterface',
    'BusinessObject',
    'BusinessProcess',
    'BusinessProduct',
    'BusinessRepresentation',
    'BusinessRole',
    'BusinessService',
    'RSLossEvent',
    'RSThreatAgent',
    'RSThreatEvent',
    'CompositeGrouping',
    'CompositeLocation',
    'RSSecurityDomain',
    'IMDeliverable',
    'IMGap',
    'IMImplementationEvent',
    'IMPlateau',
    'IMProgram',
    'IMWorkpackage',
    'MotivationAssessment',
    'MotivationConstraint',
    'MotivationDriver',
    'MotivationElement',
    'MotivationGoal',
    'MotivationGuideline',
    'MotivationMeaning',
    'MotivationMetric',
    'MotivationOptions',
    'MotivationOutcome',
    'MotivationPrinciple',
    'MotivationRecommendation',
    'MotivationRequirement',
    'MotivationStakeholder',
    'MotivationUseCase',
    'MotivationValue',
    'RSControlMeasure',
    'RSControlObjective',
    'RSRisk',
    'RSSecurityPrinciple',
    'RSVulnerability',
    'PhysicalDistributionNetwork',
    'PhysicalEquipment',
    'PhysicalFacility',
    'PhysicalMaterial',
    'StrategyCapability',
    'StrategyCourseOfAction',
    'StrategyResource',
    'StrategyValueStream',
    'TechnologyArtifact',
    'TechnologyCollaboration',
    'TechnologyCommunicationNetwork',
    'TechnologyDevice',
    'TechnologyEvent',
    'TechnologyFunction',
    'TechnologyInteraction',
    'TechnologyInterface',
    'TechnologyNode',
    'TechnologyPath',
    'TechnologyProcess',
    'TechnologyService',
    'TechnologySystemSoftware',
  ];
  relationTypes = [
    'AccessRelation',
    'AggregationRelation',
    'AssignmentRelation',
    'AssociationRelation',
    'CompositionRelation',
    'FlowRelation',
    'InfluenceRelation',
    'RealisationRelation',
    'SpecializationRelation',
    'TriggeringRelation',
    'UseRelation',
  ];
  @observable filter: Filter = { layers: [], types: [], relations: [], outgoing: true, incoming: false };

  constructor(title: string = '') {
    super(new ArangoRepository());
    this.title = title;
    this.repository.setUrl('https://big.bizzdesign.io:8530');

    this.view.nodeColor = (node: ViewNode) => {
      const color = colorScheme.get(node.layer);
      if (color === undefined) { return 'white'; }
      return color;
    }

    this.view.nodeMenu = () => {
      const menu = new Menu<ViewNode>();
      const expandOutgoingAction: Command = (node: ViewNode) => {
        this.clearSelection();
        return this.repository.getRelationsFrom(node, this.filter, this.view).then(() => this.view.layout.apply());
      }
      const expandOutgoing = new MenuOption('Expand outgoing relations', expandOutgoingAction);
      menu.options.push(expandOutgoing);
      const expandIncomingAction: Command = (node: ViewNode) => {
        this.clearSelection();
        return this.repository.getRelationsTo(node, this.filter, this.view).then(() => this.view.layout.apply());
      }
      const expandIncoming = new MenuOption('Expand incoming relations', expandIncomingAction);
      menu.options.push(expandIncoming);
      const expandAllAction: Command = (node: ViewNode) => {
        this.clearSelection();
        return this.repository.getRelationsFrom(node, this.filter, this.view)
          .then(() => this.repository.getRelationsTo(node, this.filter, this.view))
          .then(() => this.view.layout.apply());
      }
      const expandAll = new MenuOption('Expand all relations', expandAllAction);
      menu.options.push(expandAll);
      const removeAction: Command = (node: ViewNode) => new Promise<void>((resolve) => {
        node.delete();
        resolve();
      });
      const removeNode = new MenuOption('Remove', removeAction);
      menu.options.push(removeNode);
      return menu;
    }
  }
}

export default Application;