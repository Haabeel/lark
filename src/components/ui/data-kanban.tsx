import * as React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import { type Column } from "../tasks/columns";
import { TaskStatus } from "@prisma/client";
import KanbanColumnHeader from "../tasks/KanbanColumnHeader";
import KanbanCard from "../tasks/KanbanCard";
import { type FilterOptions } from "../tasks/TaskFilters";
import { type User } from "@/providers/DashboardProvider";

const boards: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
];

type TaskState = Record<TaskStatus, Column[]>;

interface DataKanbanProps {
  data: Column[];
  filters: FilterOptions;
  onChange: (
    tasks: {
      id: string;
      status: TaskStatus;
      order: number;
    }[],
  ) => void;
  user: User;
}

const DataKanban = ({ data, filters, onChange, user }: DataKanbanProps) => {
  const [allTasks, setAllTasks] = React.useState<TaskState>(() => {
    const initial: TaskState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };

    data.forEach((task) => {
      initial[task.status].push(task);
    });

    Object.values(initial).forEach((column) =>
      column.sort((a, b) => a.order - b.order),
    );

    return initial;
  });

  // Sync when new data comes from parent
  React.useEffect(() => {
    const grouped: TaskState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };

    data.forEach((task) => {
      grouped[task.status].push(task);
    });

    for (const key in grouped) {
      grouped[key as TaskStatus].sort((a, b) => a.order - b.order);
    }

    setAllTasks(grouped);
  }, [data]);

  const filteredTasks = React.useMemo(() => {
    const result: TaskState = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };

    Object.entries(allTasks).forEach(([status, tasks]) => {
      result[status as TaskStatus] = tasks.filter((task) => {
        const matchesAssignee =
          !filters.assignee || task.assigneeId === filters.assignee;

        const matchesPriority =
          !filters.priority || task.priority === filters.priority;

        const matchesDateRange =
          !filters.dateRange ||
          (task.endDate &&
            task.endDate >= filters.dateRange.from &&
            task.endDate <= filters.dateRange.to);

        const matchesDueInDays =
          !filters.dueInDays ||
          (task.endDate &&
            task.endDate.getTime() <=
              new Date().getTime() + filters.dueInDays * 86400000);

        return (
          matchesAssignee &&
          matchesPriority &&
          matchesDateRange &&
          matchesDueInDays
        );
      });
    });

    return result;
  }, [allTasks, filters]);

  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination } = result;
      const sourceStatus = source.droppableId as TaskStatus;
      const destinationStatus = destination.droppableId as TaskStatus;

      let updatesPayload: { id: string; status: TaskStatus; order: number }[] =
        [];

      setAllTasks((prevTasks) => {
        const newTasks = { ...prevTasks };

        // Full (unfiltered) source/destination columns
        const fullSource = [...newTasks[sourceStatus]];
        const fullDestination = [...newTasks[destinationStatus]];

        // Filtered source/destination columns based on active filters
        const filteredSource = filters
          ? fullSource.filter((task) => {
              if (filters.priority && task.priority !== filters.priority)
                return false;
              if (filters.assignee && task.assigneeId !== filters.assignee)
                return false;
              if (filters.dateRange) {
                const start = new Date(task.startDate);
                const end = new Date(task.endDate);
                if (
                  start < filters.dateRange.from ||
                  end > filters.dateRange.to
                )
                  return false;
              }
              if (
                filters.dueInDays &&
                new Date(task.endDate).getTime() >
                  Date.now() + filters.dueInDays * 86400000
              )
                return false;
              return true;
            })
          : fullSource;

        const filteredDestination = filters
          ? fullDestination.filter((task) => {
              if (filters.priority && task.priority !== filters.priority)
                return false;
              if (filters.assignee && task.assigneeId !== filters.assignee)
                return false;
              if (filters.dateRange) {
                const start = new Date(task.startDate);
                const end = new Date(task.endDate);
                if (
                  start < filters.dateRange.from ||
                  end > filters.dateRange.to
                )
                  return false;
              }
              if (
                filters.dueInDays &&
                new Date(task.endDate).getTime() >
                  Date.now() + filters.dueInDays * 86400000
              )
                return false;
              return true;
            })
          : fullDestination;

        // Find and remove moved task from source column
        const movedTask = fullSource.find((t) => t.id === result.draggableId);
        if (!movedTask) return prevTasks;

        const updatedTask =
          sourceStatus !== destinationStatus
            ? { ...movedTask, status: destinationStatus }
            : movedTask;

        // Remove from full source
        const newFullSource = fullSource.filter((t) => t.id !== movedTask.id);
        newTasks[sourceStatus] = newFullSource;

        // Find where in the full destination list to insert
        const afterTask = filteredDestination[destination.index];
        let insertIndex = fullDestination.length;

        if (afterTask) {
          const i = fullDestination.findIndex((t) => t.id === afterTask.id);
          insertIndex = i === -1 ? fullDestination.length : i;
        }

        // Insert in full destination
        const newFullDestination = [...fullDestination];
        newFullDestination.splice(insertIndex, 0, updatedTask);
        newTasks[destinationStatus] = newFullDestination;

        // Build updatesPayload from both affected columns
        updatesPayload = [];

        newTasks[destinationStatus].forEach((task, i) => {
          if (task.order !== i + 1 || task.id === updatedTask.id) {
            updatesPayload.push({
              id: task.id,
              status: destinationStatus,
              order: i + 1,
            });
          }
        });

        if (sourceStatus !== destinationStatus) {
          newTasks[sourceStatus].forEach((task, i) => {
            if (task.order !== i + 1) {
              updatesPayload.push({
                id: task.id,
                status: sourceStatus,
                order: i + 1,
              });
            }
          });
        }

        return newTasks;
      });

      onChange(updatesPayload);
    },
    [filters, onChange],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto">
        {boards.map((board) => (
          <div
            key={board}
            className="mx-2 min-w-[220px] flex-1 rounded-md bg-muted p-1.5"
          >
            <KanbanColumnHeader
              board={board}
              taskCount={filteredTasks[board].length}
            />
            <Droppable droppableId={board}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-h-[200px] py-1.5"
                >
                  {filteredTasks[board].map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <KanbanCard task={task} user={user} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default DataKanban;
