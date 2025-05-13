"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type DateRange } from "react-day-picker";
import { DatePickerWithPresets } from "../ui/date-picker";
import { Button } from "../ui/button";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { type Column } from "./columns";
import { type Session } from "@/lib/auth";

type Props = {
  onFilterChange: (filters: FilterOptions) => void;
  assigneeList: Column["assignee"][];
  session: Session;
  view: "table" | "kanban";
};

export interface FilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  dueInDays?: number;
}

const TaskFilters = ({
  onFilterChange,
  assigneeList,
  session,
  view,
}: Props) => {
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dueInDays, setDueInDays] = useState<number | undefined>(undefined);

  useEffect(() => {
    onFilterChange({
      status: status !== "ALL" ? (status as TaskStatus) : undefined,
      priority: priority !== "ALL" ? (priority as TaskPriority) : undefined,
      assignee: assignee !== "ALL" ? assignee : undefined,
      dateRange: dateRange
        ? {
            from: dateRange.from!,
            to: dateRange.to!,
          }
        : undefined,
      dueInDays,
    });
  }, [status, priority, assignee, dateRange, dueInDays, onFilterChange]);
  if (assigneeList == null) return null;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      {view !== "kanban" && (
        <div className="flex w-full flex-col gap-2 md:w-40">
          <label className="text-sm font-medium">Status</label>
          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {Object.values(TaskStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex w-full flex-col gap-2 md:w-40">
        <label className="text-sm font-medium">Priority</label>
        <Select onValueChange={setPriority} value={priority}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {Object.values(TaskPriority).map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-40">
        <label className="text-sm font-medium">Assignee</label>
        <Select onValueChange={setAssignee} value={assignee}>
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {assigneeList.map((member) => {
              if (member == null) return null;
              return (
                <SelectItem key={member?.id} value={member?.id}>
                  {session.user.id === member?.userId ? (
                    <>
                      <span>{member?.user.name}</span>
                      <span className="text-xs text-gray-500"> (You)</span>
                    </>
                  ) : (
                    <span>{member?.user.name}</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-60">
        <label className="text-sm font-medium">Date Range</label>
        <DatePickerWithPresets value={dateRange} onChange={setDateRange} />
      </div>

      <Button
        variant="outline"
        onClick={() => {
          setStatus("ALL");
          setPriority("ALL");
          setAssignee("ALL");
          setDateRange(undefined);
          setDueInDays(undefined);
        }}
      >
        Reset
      </Button>
    </div>
  );
};

export default TaskFilters;
