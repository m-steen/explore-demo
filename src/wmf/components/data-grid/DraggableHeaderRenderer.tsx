import React, { useState } from 'react';
import Draggable from 'react-draggable';

// import { useDrag, useDrop } from 'react-dnd';

import { HeaderRendererProps } from 'react-data-grid';

// import { ColumnDragObject } from '../PropertySheet';

// function wrapRefs<T>(...refs: React.Ref<T>[]) {
//   return (handle: T | null) => {
//     for (const ref of refs) {
//       if (typeof ref === 'function') {
//         ref(handle);
//       } else if (ref !== null) {
//         // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
//         (ref as React.MutableRefObject<T | null>).current = handle;
//       }
//     }
//   };
// }

export function DraggableHeaderRenderer<R>({ onColumnsReorder, onDropProperty, removeColumn, ...props }: HeaderRendererProps<R> 
    & { onColumnsReorder: (sourceKey: string, targetKey: string) => void }
    & { onDropProperty: (sourceKey: string, targetKey: string) => void } 
    & { removeColumn: (columnKey: string) => void }) {

      const [isDragging, setDragging] = useState(false);
  // const [{ isDragging }, drag] = useDrag({
  //   item: { key: props.column.key, type: 'COLUMN_DRAG' },
  //   collect: monitor => ({
  //     isDragging: !!monitor.isDragging()
  //   })
  // });

  // const [{ isOver }, drop] = useDrop({
  //   accept: ['COLUMN_DRAG', 'PROPERTY_DRAG'],
  //   drop({ key, type }: ColumnDragObject) {
  //     if (type === 'COLUMN_DRAG') {
  //       onColumnsReorder(key, props.column.key);
  //     }
  //     if (type === 'PROPERTY_DRAG') {
  //       onDropProperty(key, props.column.key);
  //     }
  //   },
  //   collect: monitor => ({
  //     isOver: !!monitor.isOver(),
  //     canDrop: !!monitor.canDrop()
  //   })
  // });

  function onColumnRemove(event: React.MouseEvent) {
    removeColumn(props.column.key);
    event.stopPropagation();
  }

  function handleDragStart() {
    setDragging(true);
  }

  function handleDragStop() {
    setDragging(false);
  }

  return (
    <Draggable onStart={handleDragStart} onStop={handleDragStop}>
      <div
        // ref={wrapRefs(drag, drop)}
        style={{
          opacity: isDragging ? 0.5 : 1,
          // backgroundColor: isOver ? '#ececec' : 'inherit',
          cursor: 'move'
        }}
      >
        {props.column.name}{' '}
        <button type="button" onClick={onColumnRemove}>X</button>
      </div>
    </Draggable>
  );
}
