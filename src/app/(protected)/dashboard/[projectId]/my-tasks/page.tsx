"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  CalendarDays,
  UserCircle,
  ChevronsRight,
  AlertTriangle,
  FlagTriangleRight,
  ListChecks,
  Folders,
  Inbox, // For project section / kanban column
} from "lucide-react";
import { format, isPast, isToday, isFuture, differenceInDays } from "date-fns";
import { TaskPriority, TaskStatus } from "@prisma/client"; // Your Prisma enums
import { initials, cn } from "@/lib/utils";
import ViewTaskDialog from "@/components/tasks/ViewTaskDialog";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/server/api/root";
import { Column } from "@/components/tasks/columns";

type Task =
  inferRouterOutputs<AppRouter>["project"]["getMyTasksAcrossProjects"][number];

// Helper function to get badge variant based on status
const getStatusVariant = (
  status: TaskStatus,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case TaskStatus.TODO:
      return "outline";
    case TaskStatus.IN_PROGRESS:
      return "default"; // Use theme's primary
    case TaskStatus.BACKLOG:
      return "secondary";
    case TaskStatus.DONE:
      return "secondary"; // Consider a "success" variant if you add one
    default:
      return "outline";
  }
};

// Helper function to get badge/text color based on priority
const getPriorityAppearance = (
  priority: TaskPriority,
): {
  variant: "default" | "destructive" | "secondary";
  label: string;
  icon?: React.ReactNode;
} => {
  switch (priority) {
    case TaskPriority.HIGH:
      return {
        variant: "destructive",
        label: "High",
        icon: <AlertTriangle className="mr-1 h-3 w-3" />,
      };
    case TaskPriority.MEDIUM:
      return { variant: "default", label: "Medium" }; // E.g., orange/yellow theme color
    case TaskPriority.LOW:
      return { variant: "secondary", label: "Low" };
    default:
      return { variant: "secondary", label: "None" };
  }
};

// Helper function to format due date and provide context
const formatDueDate = (dueDate: Date | null) => {
  // endDate from your schema
  if (!dueDate)
    return { text: "No due date", className: "text-muted-foreground" };
  const date = new Date(dueDate);
  if (isToday(date))
    return {
      text: `Today, ${format(date, "MMM d")}`,
      className: "text-amber-600 dark:text-amber-500 font-medium",
    };
  if (isPast(date) && !isToday(date))
    return {
      text: `Overdue: ${format(date, "MMM d, yyyy")}`,
      className: "text-red-600 dark:text-red-500 font-medium",
    };
  if (isFuture(date)) {
    const daysDiff = differenceInDays(date, new Date());
    if (daysDiff < 0) {
      // Should be caught by isPast, but as a fallback
      return {
        text: `Overdue: ${format(date, "MMM d, yyyy")}`,
        className: "text-red-600 dark:text-red-500 font-medium",
      };
    }
    if (daysDiff === 0 && !isToday(date)) {
      // Due tomorrow but still technically 0 days diff until EOD
      return {
        text: `Tomorrow, ${format(date, "MMM d")}`,
        className: "text-amber-600 dark:text-amber-500",
      };
    }
    if (daysDiff < 7)
      return {
        text: `Due in ${daysDiff + 1} day(s), ${format(date, "MMM d")}`,
        className: "text-green-600 dark:text-green-500",
      };
    if (daysDiff > 7) {
      return {
        text: `Due in ${daysDiff} day(s), ${format(date, "MMM d")}`,
        className: "text-muted-foreground",
      };
    }
    return { text: format(date, "MMM d, yyyy"), className: "text-foreground" };
  }
  // Fallback for dates that are somehow not past, today, or future (shouldn't happen with valid dates)
  return { text: format(date, "MMM d, yyyy"), className: "text-foreground" };
};

export default function MyTasksPage() {
  const {
    data: projectsWithTasks,
    isLoading,
    isError,
    error,
  } = api.project.getMyTasksAcrossProjects.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Column | null>(null);

  // Function to open dialog with setTimeout 0 as requested
  const openTaskDialog = (task: Column) => {
    setTimeout(() => {
      setSelectedTask(task);
      setDialogOpen(true);
    }, 0);
  };
  const defaultOpenAccordionItems = useMemo(() => {
    return (
      projectsWithTasks
        ?.filter((p) => p.tasks.length > 0)
        .map((p) => p.projectId) ?? []
    );
  }, [projectsWithTasks]);

  const totalTaskCount = useMemo(() => {
    return (
      projectsWithTasks?.reduce(
        (sum, project) => sum + project.tasks.length,
        0,
      ) ?? 0
    );
  }, [projectsWithTasks]);

  if (isLoading) {
    /* ... loading UI (same as before) ... */
  }
  if (isError) {
    /* ... error UI (same as before) ... */
  }

  if (!projectsWithTasks || totalTaskCount === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center p-4 text-center">
        <ListChecks className="mb-6 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          All Clear!
        </h2>
        <p className="text-muted-foreground">
          You currently have no tasks assigned to you across your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-2 py-8 sm:px-4 md:py-12">
      {" "}
      {/* Max width increased */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Folders className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            My Tasks Overview
          </h1>
        </div>
        <p className="text-muted-foreground">
          You have {totalTaskCount} task{totalTaskCount !== 1 ? "s" : ""}{" "}
          assigned across {projectsWithTasks.length} project
          {projectsWithTasks.length !== 1 ? "s" : ""}.
        </p>
      </header>
      <Separator />
      <TooltipProvider delayDuration={200}>
        <Accordion
          type="multiple"
          defaultValue={defaultOpenAccordionItems}
          className="w-full space-y-4" // Increased space between accordions
        >
          {projectsWithTasks.map(
            (projectGroup) =>
              projectGroup.tasks.length > 0 && (
                <AccordionItem
                  key={projectGroup.projectId}
                  value={projectGroup.projectId}
                  className="overflow-hidden rounded-lg border bg-card shadow-sm"
                >
                  <AccordionTrigger className="rounded-t-lg px-4 py-3 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b data-[state=open]:bg-muted/50">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-5 w-5 flex-shrink-0 rounded-sm"
                          style={{
                            backgroundColor:
                              projectGroup.projectColor ||
                              "hsl(210, 40%, 96.1%)",
                          }}
                        />
                        <span
                          className="max-w-[200px] truncate text-lg font-medium text-foreground sm:max-w-xs md:max-w-sm"
                          title={projectGroup.projectName}
                        >
                          {projectGroup.projectName}
                        </span>
                      </div>
                      <Badge variant="outline" className="h-6 text-xs">
                        {projectGroup.tasks.length} task
                        {projectGroup.tasks.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 py-0 sm:px-0 md:px-0">
                    {" "}
                    {/* Remove padding from content, add to inner cards if needed */}
                    <div className="divide-y divide-border">
                      {" "}
                      {/* Divide tasks within a project */}
                      {projectGroup.tasks.map((task) => {
                        const priorityInfo = getPriorityAppearance(
                          task.priority,
                        );
                        const dueDateInfo = formatDueDate(task.endDate); // Use endDate from your schema
                        const creatorInfo = task.createdBy?.user; // User who created the task via Member record

                        return (
                          <div
                            key={task.id}
                            className="p-3 transition-colors hover:bg-muted/30 sm:p-4"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row">
                              <div className="flex-grow">
                                <div
                                  onClick={() => {
                                    setTimeout(() => {
                                      setSelectedTask(task);
                                      setDialogOpen(true);
                                    }, 0);
                                  }}
                                  className="group"
                                >
                                  <h3
                                    className="text-md line-clamp-2 cursor-pointer font-semibold text-foreground group-hover:text-primary group-hover:underline"
                                    title={task.title}
                                  >
                                    {task.title}
                                  </h3>
                                </div>
                                {task.column && ( // KanbanColumn / Project Section
                                  <p className="mt-0.5 flex items-center text-xs text-muted-foreground">
                                    <Inbox className="mr-1.5 h-3 w-3" />{" "}
                                    Section: {task.column.name}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={getStatusVariant(task.status)}
                                className="mt-1 h-5 w-fit px-2 py-0.5 text-xs sm:mt-0"
                              >
                                {task.status.replace("_", " ")}
                              </Badge>
                            </div>

                            {task.description && (
                              <p
                                className="mt-1.5 line-clamp-2 text-xs text-muted-foreground"
                                title={task.description}
                              >
                                {task.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-col items-start justify-between gap-x-4 gap-y-2 text-xs sm:flex-row sm:items-center">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "flex items-center",
                                        dueDateInfo.className,
                                      )}
                                    >
                                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                                      <span>{dueDateInfo.text}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Due:{" "}
                                      {task.endDate
                                        ? format(new Date(task.endDate), "PPP")
                                        : "Not set"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant={priorityInfo.variant}
                                      className="cursor-default px-1.5 py-0 text-[10px] font-normal"
                                    >
                                      {priorityInfo.icon} {priorityInfo.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{priorityInfo.label} Priority</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                {creatorInfo && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center text-muted-foreground">
                                        <span className="mr-1">By:</span>
                                        <Avatar className="h-5 w-5">
                                          <AvatarImage
                                            src={creatorInfo.image ?? undefined}
                                          />
                                          <AvatarFallback className="text-[10px]">
                                            {initials(
                                              creatorInfo.firstName ?? "?",
                                            )}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        Created by{" "}
                                        {creatorInfo.name ||
                                          creatorInfo.firstName}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Button
                                  variant="ghost"
                                  size="default"
                                  className="h-6 px-1.5 text-xs"
                                  onClick={() =>
                                    openTaskDialog({
                                      assignee: task.assignee,
                                      assigneeId: task.assigneeId,
                                      createdById: task.createdById,
                                      description: task.description,
                                      endDate: task.endDate,
                                      id: task.id,
                                      priority: task.priority,
                                      projectId: task.projectId,
                                      startDate: task.startDate,
                                      status: task.status,
                                      title: task.title,
                                      updatedAt: task.updatedAt,
                                      createdAt: task.createdAt,
                                      columnId: task.columnId,
                                      order: task.order,
                                    })
                                  }
                                >
                                  Details{" "}
                                  <ChevronsRight className="ml-1 h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ),
          )}
        </Accordion>
      </TooltipProvider>
      {selectedTask && (
        <ViewTaskDialog
          onOpenAction={setDialogOpen}
          open={dialogOpen}
          task={selectedTask}
        />
      )}
    </div>
  );
}
