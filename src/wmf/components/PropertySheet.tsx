import React from 'react';
// import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { PropertyEditor } from './PropertyEditor';
import { IProperty } from '../model/properties';
import { MModel } from '../model/model';
import Editor from '../editor/editor';
// import { useDrag, DragObjectWithType } from 'react-dnd';

interface PropertySheetProps {
  model: MModel,
  editor: Editor,
}


// export interface ColumnDragObject extends DragObjectWithType {
//   key: string;
// }

const DraggableProperty: React.FC<{ property: IProperty }> = (props) => {
  const { property } = props;
  // const [{ isDragging }, drag] = useDrag({
  //   item: { key: property.name, type: 'PROPERTY_DRAG' },
  //   collect: monitor => ({
  //     isDragging: !!monitor.isDragging()
  //   })
  // });

  return (
    <React.Fragment>
      <tr key={property.name}
        // ref={drag}
        style={{
          // opacity: isDragging ? 0.5 : 1,
          // backgroundColor: isOver ? '#ececec' : 'inherit',
          cursor: 'move'
        }}
      >
        <td draggable={true}>{property.label}:</td>
        <td><PropertyEditor property={property} readOnly={true} /></td>
      </tr>
      {/* {isDragging &&
        ReactDOM.createPortal(
          <div key={property.name} draggable={true}
            ref={drag}
            style={{
              opacity: isDragging ? 0.5 : 1,
              // backgroundColor: isOver ? '#ececec' : 'inherit',
              cursor: 'move'
            }}
          >
            {property.label}
          </div>,
          document.body
        )} */}
    </React.Fragment>
  )
}

export const PropertySheet: React.FC<PropertySheetProps> = observer((props) => {
  const { selection } = props.editor;
  const { objects, relations } = props.model;
  const selectedObjects = (objects.concat(relations)).filter((obj) => selection.includes(obj.id));
  let properties: IProperty[] = selection.length > 0 ? [
    {
      name: 'id',
      label: 'ID',
      type: 'string',
      value: selectedObjects[0].id,
    },
    {
      name: 'nm',
      label: 'Name',
      type: 'string',
      value: selectedObjects[0].name,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'string',
      value: selectedObjects[0].type,
    },
  ]
  : [];
  selectedObjects.forEach((obj) => {
    obj.getProperties().forEach((property) => {
      const existingProperty = properties.find((p) => p.name === property.name);
      if (!existingProperty) {
        properties.push(property);
      }
    })
  });

  return (
    selection.length > 0 ?
      <div >
        <table>
          <tbody>
            {properties.map((property) => (<DraggableProperty key={property.name} property={property} />))}
          </tbody>
        </table>
      </div>
      : <div>Select an object to see its properties.</div>
  );
});
