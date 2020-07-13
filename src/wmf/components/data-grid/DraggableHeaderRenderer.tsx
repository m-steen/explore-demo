import React, { useRef } from 'react';
import { useDrag, useDrop, DragObjectWithType } from 'react-dnd';

import { HeaderRendererProps } from 'react-data-grid';

const COLUMN = 'COLUMN';

interface ColumnDragObject extends DragObjectWithType {
  key: string;
}

export function DraggableHeaderRenderer<R>({ onColumnsReorder, onDropProperty, removeColumn, ...props }: HeaderRendererProps<R> 
    & { onColumnsReorder: (sourceKey: string, targetKey: string) => void }
    & { onDropProperty: (sourceKey: string, targetKey: string) => void } 
    & { removeColumn: (columnKey: string) => void }) {

  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    item: { key: props.column.key, type: COLUMN },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: COLUMN,
    drop({ key, type }: ColumnDragObject) {
      if (type === COLUMN) {
        onColumnsReorder(key, props.column.key);
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

  function onColumnRemove(event: React.MouseEvent) {
    removeColumn(props.column.key);
    event.stopPropagation();
  }

  drag(drop(ref));

  return (
    <div style={{position: 'absolute', width: '90%'}}>
      <div
        ref={ref}
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isOver ? '#ececec' : 'inherit',
          cursor: 'move'
        }}
      >
        {props.column.name}
      </div>
      <button type="button" onClick={onColumnRemove} style={{position: 'absolute', top: 0, right: 0}}>X</button>
    </div>
  );
}
