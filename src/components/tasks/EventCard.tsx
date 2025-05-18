"use client";

import { cn, initials } from "@/lib/utils";
import { type Column } from "./columns";
import Image from "next/image";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import EditTaskDialog from "./EditTaskDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { type User } from "@/providers/DashboardProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Delete, Edit3Icon } from "lucide-react";
import DisplayTaskDialog from "./ViewTaskDialog";

interface EventCardProps {
  task: Column | undefined;
  title: string;
  assignee: Column["assignee"];
  status: Column["status"];
  id: string;
  user: User;
}

const statusColorMap: Record<Column["status"], string> = {
  BACKLOG: "border-l-pink-400",
  TODO: "border-l-blue-400",
  IN_PROGRESS: "border-l-yellow-400",
  DONE: "border-l-green-400",
};

const EventCard = ({ title, status, user, assignee, task }: EventCardProps) => {
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // stop rbc from hijacking the event
    console.log("Context menu opened");
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onContextMenu={(e) => handleContextMenu(e)}
            onClick={() => {
              setTimeout(() => {
                setViewDialogOpen(true);
              }, 0);
            }}
            className="px-2"
          >
            <div
              className={cn(
                "flex cursor-pointer flex-col gap-y-1.5 rounded-md border-l-4 bg-white p-1.5 text-xs shadow-sm transition hover:opacity-75 dark:bg-neutral-900",
                statusColorMap[status],
              )}
            >
              <p className="line-clamp-2">{title}</p>
              <div className="flex items-center gap-x-1.5">
                {assignee?.user.image ? (
                  <Image
                    src={assignee.user.image}
                    alt={assignee.user.name}
                    className="size-7 rounded-full"
                    height={32}
                    width={32}
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-foundation-purple-400 text-xs text-neutral-100">
                    {initials(assignee?.user.name ?? "")}
                  </div>
                )}
                <div className="size-1 h-1 w-1 rounded-full bg-neutral-500 dark:bg-white" />
                <p className="line-clamp-1 text-xs">{assignee?.user.name}</p>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {user.memberships.find(
            (member) => member.projectId === task?.projectId,
          )?.role === "MAINTAINER" ? (
            <>
              <ContextMenuItem
                onClick={() =>
                  setTimeout(() => {
                    setEditOpen(true);
                  }, 0)
                }
                className="flex items-center justify-between text-xs"
              >
                Edit
                <Edit3Icon className="size-4" />
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  setTimeout(() => {
                    setDeleteOpen(true);
                  }, 0)
                }
                className="flex items-center justify-between text-xs text-red-600 opacity-70"
              >
                Delete
                <Delete className="size-4" />
              </ContextMenuItem>
            </>
          ) : (
            <>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ContextMenuItem
                      disabled
                      className="flex items-center justify-between text-xs opacity-70"
                    >
                      Edit
                      <Edit3Icon className="size-4" />
                    </ContextMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Only maintainers can edit.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ContextMenuItem
                      disabled
                      className="flex items-center justify-between text-xs text-red-600 opacity-70"
                    >
                      Delete
                      <Delete className="size-4" />
                    </ContextMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Only maintainers can delete.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {task && (
        <>
          <EditTaskDialog
            open={editOpen}
            onOpenAction={(
              open: boolean | ((prevState: boolean) => boolean),
            ) => {
              setEditOpen(open);
            }}
            task={task}
          />
          <DeleteTaskDialog
            open={deleteOpen}
            onOpenAction={(isOpen) => {
              setDeleteOpen(isOpen);
            }}
            task={task}
          />
          <DisplayTaskDialog
            open={viewDialogOpen}
            task={task}
            onOpenAction={setViewDialogOpen}
          />
        </>
      )}
    </>
  );
};

export default EventCard;
