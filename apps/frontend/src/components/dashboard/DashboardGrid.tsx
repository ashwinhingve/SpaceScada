'use client';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface DashboardGridProps {
  widgets: DashboardWidget[];
  onWidgetsChange?: (widgets: DashboardWidget[]) => void;
  onRemoveWidget?: (widgetId: string) => void;
  editable?: boolean;
}

interface SortableWidgetProps {
  widget: DashboardWidget;
  onRemove?: (widgetId: string) => void;
  editable?: boolean;
}

function SortableWidget({ widget, onRemove, editable }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSizeClass = (size?: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      case 'full':
        return 'col-span-full';
      default:
        return 'col-span-1';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:border-border group',
        getSizeClass(widget.size)
      )}
    >
      {editable && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 hover:bg-background cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onRemove(widget.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="p-1">{widget.component}</div>
    </div>
  );
}

export function DashboardGrid({
  widgets,
  onWidgetsChange,
  onRemoveWidget,
  editable = false,
}: DashboardGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState(widgets);

  React.useEffect(() => {
    setItems(widgets);
  }, [widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);

      setItems(newItems);
      onWidgetsChange?.(newItems);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleRemove = (widgetId: string) => {
    const newItems = items.filter((item) => item.id !== widgetId);
    setItems(newItems);
    onRemoveWidget?.(widgetId);
    onWidgetsChange?.(newItems);
  };

  const activeWidget = items.find((w) => w.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((widget) => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              onRemove={editable ? handleRemove : undefined}
              editable={editable}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeWidget ? (
          <div className="rounded-lg border border-primary bg-card shadow-2xl opacity-80 p-1">
            {activeWidget.component}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
