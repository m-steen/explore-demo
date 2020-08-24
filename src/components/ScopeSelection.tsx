import React from 'react';
import { observer } from 'mobx-react';
import { TreeView } from '../wmf/components/tree-view/TreeView';
import { MModel, MObject } from '../wmf/model/model';

export interface IScopeSelection {
  model: MModel;
  scope: string[];
}

export const ScopeSelection: React.FC<IScopeSelection> = observer((props) => {

  function handleNodeSelect(object: MObject, selected: boolean) {
    const id = object.id;
    if (selected && !props.scope.includes(id)) {
      props.scope.push(id);
    } else if (props.scope.includes(id)) {
      props.scope.splice(props.scope.indexOf(id), 1);
    }
    console.log('scope', props.scope)
  }

  function onExpandNode(object: MObject) {
    props.model.editor.repository.fetchChildren(props.model, object);
  }

  return (
    <TreeView model={props.model} selection={props.scope} onExpandNode={onExpandNode} onNodeSelect={handleNodeSelect} />
  )
});
