"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import CreateTasksDialog from "./create-tasks-dialog";
import { useQueryState } from "nuqs";
import { api } from "@/trpc/react";
import { useDashboard } from "@/providers/DashboardProvider";
import { DataTable } from "../ui/data-table";
import { type Column, Columns } from "./columns";
import TaskFilters, { type FilterOptions } from "./TaskFilters"; // assuming FilterOptions is exported
import { differenceInCalendarDays } from "date-fns";
import { TableSkeleton } from "./TableSkeleton";
import DataKanban from "../ui/data-kanban";
import { type TaskStatus } from "@prisma/client";
import useRefetch from "@/hooks/useRefetch";
import DataCalendar from "../ui/data-calendar";
import KanbanSkeleton from "./KanbanSkeleton";
import CalendarSkeleton from "./CalendarSkeleton";
import { toast } from "sonner";

function isWithinIntervalRange(
  taskStart: Date | string,
  taskEnd: Date | string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const start = new Date(taskStart);
  const end = new Date(taskEnd);

  return (
    start.getTime() >= rangeStart.getTime() &&
    end.getTime() <= rangeEnd.getTime()
  );
}

function filterTasks(tasks: Column[], options: FilterOptions): Column[] {
  const { status, priority, assignee, dateRange, dueInDays } = options;
  return tasks.filter((task) => {
    if (status && task.status !== status) return false;
    if (priority && task.priority !== priority) return false;
    if (assignee && task.assignee?.id !== assignee) return false;
    if (dateRange?.from && !dateRange.to) dateRange.to = dateRange.from;
    console.log(dateRange);
    if (
      dateRange?.from &&
      dateRange?.to &&
      !isWithinIntervalRange(
        task.startDate,
        task.endDate,
        dateRange.from,
        dateRange.to,
      )
    ) {
      return false;
    }

    if (
      typeof dueInDays === "number" &&
      differenceInCalendarDays(new Date(task.endDate), new Date()) > dueInDays
    ) {
      return false;
    }

    return true;
  });
}
const TaskViewSwitcher = () => {
  const dashboard = useDashboard();
  const [view, setView] = useQueryState("view", {
    defaultValue: "table",
  });
  const { mutate: reorderTasks } = api.project.reorderTask.useMutation();
  const [filters, setFilters] = React.useState<FilterOptions>({});
  const refetch = useRefetch();
  const onKanbanChange = React.useCallback(
    (tasks: { id: string; status: TaskStatus; order: number }[]) => {
      reorderTasks(
        {
          updates: tasks,
        },
        {
          onSuccess: () => {
            toast.success("Tasks reordered successfully");
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            refetch();
          },
          onError: (error) => {
            console.error("Error reordering tasks:", error);
            toast.error("Failed to reorder tasks");
          },
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reorderTasks],
  );
  if (dashboard == null) return null;

  const { selectedProject, session, user } = dashboard;
  const project = dashboard?.project;
  const isMaintainer =
    project?.members.find((member) => member.userId === user?.id)?.role ===
    "MAINTAINER";
  const { data: tasks, isLoading } = api.project.getTasks.useQuery({
    projectId: selectedProject,
  });

  const filteredTasks = tasks ? filterTasks(tasks, filters) : [];

  const uniqueAssignees = tasks
    ? Array.from(
        new Map(
          tasks
            .filter((t) => t.assignee)
            .map((t) => [t.assignee!.id, t.assignee!]),
        ).values(),
      )
    : [];
  console.log(view);
  return (
    <Tabs
      defaultValue={view}
      onValueChange={setView}
      className="w-full flex-1 rounded-lg border"
    >
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="mb-4 flex flex-col items-center justify-between gap-y-2 lg:flex-row">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>
          <CreateTasksDialog isMaintainer={isMaintainer} view="table" />
        </div>
        {!isLoading && (
          <TaskFilters
            onFilterChange={setFilters}
            assigneeList={uniqueAssignees}
            session={session!}
            view={(view as "table") ? "table" : "kanban"}
          />
        )}
        <>
          <TabsContent value="table" className="mt-0">
            {!isLoading && user ? (
              <DataTable
                columns={Columns}
                data={filteredTasks}
                user={user}
                selectedProject={selectedProject}
              />
            ) : (
              <TableSkeleton columns={8} />
            )}
          </TabsContent>
          <TabsContent value="kanban" className="mt-2">
            {!isLoading && user ? (
              <DataKanban
                isMaintainer={isMaintainer}
                data={tasks ?? []}
                onChange={onKanbanChange}
                filters={filters}
                user={user}
              />
            ) : (
              <KanbanSkeleton />
            )}
          </TabsContent>
          <TabsContent value="calendar" className="mt-2 h-full pb-4">
            {!isLoading && user ? (
              <DataCalendar
                data={filteredTasks}
                user={user}
                selectedProject={selectedProject}
              />
            ) : (
              <CalendarSkeleton />
            )}
          </TabsContent>
        </>
      </div>
    </Tabs>
  );
};

export default TaskViewSwitcher;
