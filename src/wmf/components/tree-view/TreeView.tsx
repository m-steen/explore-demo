import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { MObject, MModel } from '../../model/model';
import { ListGroup, Collapse } from 'react-bootstrap';

interface TreeViewProps {
  model: MModel;
  hierarchyRelation?: string;
}

export const TreeView: React.FC<TreeViewProps> = observer((props) => {
  console.log('rendering TreeView')

  const { objects } = props.model;
  const rootNodes = objects.filter((obj) => (obj.parentID === undefined || obj.parentID === '' || -1 === objects.findIndex((o) => obj.parentID === o.id)));
  console.log(rootNodes)

  return (
    <div>
      <ListGroup>
        {rootNodes.map((node) => <TreeNode object={node} model={props.model} hierarchyRelation={props.hierarchyRelation} />)}
      </ListGroup>
    </div>
  );
});

interface TreeNodeProps {
  object: MObject;
  model: MModel;
  hierarchyRelation?: string
}

export const TreeNode: React.FC<TreeNodeProps> = observer((props) => {
  console.log('rendering TreeNode', props.object)
  const [expand, setExpand] = useState(false);

  const children = props.model.objects.filter((obj) => props.object.children.includes(obj.id));

  return (
    <ListGroup.Item>
      <span onClick={() => setExpand(!expand)}>{props.object.name}</span>
      <Collapse in={expand} unmountOnExit>
        <ListGroup>
          {children.map((child) => <TreeNode object={child} model={props.model} hierarchyRelation={props.hierarchyRelation} />)}
        </ListGroup>
      </Collapse>
    </ListGroup.Item>
  );
});
