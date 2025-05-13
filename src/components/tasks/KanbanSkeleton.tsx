/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { type TaskStatus } from "@prisma/client";

const statusTitles: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const KanbanSkeleton = () => {
  return (
    <div className="flex overflow-x-auto">
      {Object.entries(statusTitles).map(([statusKey, statusTitle]) => (
        <div
          key={statusKey}
          className="mx-2 min-w-[220px] flex-1 rounded-md bg-muted p-1.5"
        >
          {/* Column Header */}
          <div className="mb-2 px-2">
            <p className="text-sm font-semibold">{statusTitle}</p>
          </div>

          {/* Skeleton Cards */}
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-md border-l-4 bg-white p-2 shadow-sm dark:bg-neutral-900"
              >
                <Skeleton className="mb-2 h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-1 rounded-full bg-neutral-400" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanSkeleton;
