import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { MObject, MModel } from '../../model/model';
import { ListGroup, Collapse, Form } from 'react-bootstrap';
import { KeyboardArrowRight, KeyboardArrowDown } from '@material-ui/icons';


interface TreeViewProps {
  model: MModel;
  hierarchyRelation?: string;
  selection?: string[];
  onExpandNode?: (node: MObject) => void;
  onNodeSelect?: (node: MObject, selected: boolean) => void;
}

export const TreeView: React.FC<TreeViewProps> = observer((props) => {

  const { objects } = props.model;
  const rootNodes = objects.filter((obj) => (
    obj.parentID === undefined ||
    obj.parentID === '' ||
    -1 === objects.findIndex((o) => obj.parentID === o.id)
  ));

  return (
    <div>
      <ListGroup>
        {rootNodes.map((node) =>
          <TreeNode key={node.id}
            object={node}
            model={props.model}
            hierarchyRelation={props.hierarchyRelation}
            selection={props.selection}
            onExpandNode={props.onExpandNode}
            onNodeSelect={props.onNodeSelect}
          />)}
      </ListGroup>
    </div>
  );
});

interface TreeNodeProps {
  object: MObject;
  model: MModel;
  hierarchyRelation?: string;
  selection?: string[];
  onExpandNode?: (node: MObject) => void;
  onNodeSelect?: (node: MObject, selected: boolean) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = observer((props) => {

  const [expand, setExpand] = useState(false);

  const { model, object, selection, onExpandNode, onNodeSelect } = props;

  const children = model.objects.filter((obj) => object.children.includes(obj.id));

  function onToggleExpand() {
    if (!expand && onExpandNode) {
      onExpandNode(object);
    }
    setExpand(!expand);
  }

  const isSelected = selection?.includes(object.id) ?? false;
  const nodeLabel = onNodeSelect !== undefined ?
    <Form.Check
      type='checkbox'
      inline
      checked={isSelected}
      label={object._name}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onNodeSelect(object, e.target.checked);
        e.stopPropagation();
      }}
    />
    : <span>{object._name}</span>

  return (
    <ListGroup.Item>
      <span onClick={onToggleExpand}>
        {expand ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
        {nodeLabel}
      </span>
      <Collapse in={expand} unmountOnExit>
        <ListGroup>
          {children.map((child) =>
            <TreeNode key={child.id}
              object={child}
              model={model}
              hierarchyRelation={props.hierarchyRelation}
              selection={selection}
              onExpandNode={onExpandNode}
              onNodeSelect={onNodeSelect}
            />)}
        </ListGroup>
      </Collapse>
    </ListGroup.Item>
  );
});
