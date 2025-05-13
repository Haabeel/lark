import * as React from "react";

import { initials } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { type Column } from "./columns";
import { format } from "date-fns";
import Image from "next/image";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import EditTaskDialog from "./EditTaskDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Delete, Edit3Icon } from "lucide-react";
import { type User } from "@/providers/DashboardProvider";
import DisplayTaskDialog from "./ViewTaskDialog";

interface KanbanCardProps {
  task: Column;
  user: User;
}

const KanbanCard = ({ task, user }: KanbanCardProps) => {
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={() => {
              setTimeout(() => {
                setViewDialogOpen(true);
              }, 0);
            }}
            className="mb-1.5 space-y-3 rounded bg-neutral-200 p-2.5 shadow-sm dark:bg-foundation-blue-800"
          >
            <div className="flex items-start justify-between gap-x-2">
              <p className="line-clamp-2 text-sm">{task.title}</p>
            </div>
            <Separator className="bg-neutral-400" />
            <div className="flex items-center gap-x-1.5">
              {task.assignee?.user.image && (
                <Image
                  src={task.assignee?.user.image}
                  alt={task.assignee?.user.name}
                  className="size-7 rounded-full"
                  height={32}
                  width={32}
                />
              )}
              {!task.assignee?.user.image && (
                <div className="flex size-7 items-center justify-center rounded-full bg-foundation-purple-400 text-xs text-neutral-100">
                  {initials(task.assignee?.user.name ?? "")}
                </div>
              )}
              <div className="size-1 h-1 w-1 rounded-full bg-muted dark:bg-white" />
              <p className="text-xs">{format(new Date(task.endDate), "PPP")}</p>
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

export default KanbanCard;
