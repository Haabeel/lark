"use client";

import * as React from "react";
import { useDashboard } from "@/providers/DashboardProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { type Column } from "./columns";

interface DisplayTaskDialogProps {
  open: boolean;
  onOpenAction: (open: boolean) => void;
  task: Column;
}

export default function DisplayTaskDialog({
  open,
  onOpenAction,
  task,
}: DisplayTaskDialogProps) {
  const dashboard = useDashboard();
  if (!dashboard) return null;

  const { project } = dashboard;

  return (
    <Dialog open={open} onOpenChange={onOpenAction}>
      <DialogContent className="border-none bg-neutral-300 dark:bg-foundation-blue-800">
        <DialogHeader>
          <DialogTitle>View Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-100">
          <div>
            <label className="font-semibold">Title</label>
            <p className="rounded border bg-white/10 p-2">{task.title}</p>
          </div>
          <div>
            <label className="font-semibold">Description</label>
            <p className="rounded border bg-white/10 p-2">
              {task.description === undefined || task.description === ""
                ? "No description"
                : task.description}
            </p>
          </div>
          <div>
            <label className="font-semibold">Assignee</label>
            <p className="rounded border bg-white/10 p-2">
              {project?.members.find((m) => m.id === task.assigneeId)?.user
                .name ?? "Unknown"}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Priority</label>
              <p className="rounded border bg-white/10 p-2">{task.priority}</p>
            </div>
            <div className="flex-1">
              <label className="font-semibold">Status</label>
              <p className="rounded border bg-white/10 p-2">{task.status}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-semibold">Start Date</label>
              <p className="rounded border bg-white/10 p-2">
                {task.startDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1">
              <label className="font-semibold">End Date</label>
              <p className="rounded border bg-white/10 p-2">
                {task.endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
