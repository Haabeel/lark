"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";

export type Column =
  inferRouterOutputs<AppRouter>["project"]["getTasks"][number];

export const Columns: ColumnDef<Column>[] = [
  {
    accessorKey: "id",
    enableHiding: true,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-center"
      >
        Sr. No.
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <span className="flex w-full items-center justify-center font-bold">
          {row.index + 1}
        </span>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-center"
      >
        Task
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <span className="flex w-full items-center justify-center truncate font-medium">
          {task.title}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="flex w-full items-center justify-center">Status</span>
    ),
    cell: ({ row }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const status = row.getValue("status") as string;
      const color =
        status === "TODO"
          ? "bg-blue-400 text-blue-800 hover:bg-blue-600"
          : status === "IN_PROGRESS"
            ? "bg-yellow-400 text-yellow-800 hover:bg-yellow-600"
            : status === "BACKLOG"
              ? "bg-pink-400 text-pink-800 hover:bg-pink-600"
              : "bg-green-400 text-green-800 hover:bg-green-600";
      return (
        <Badge
          className={cn(
            color,
            "flex w-full cursor-default items-center justify-center text-xs",
          )}
        >
          {status.replaceAll("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priority",
    header: () => (
      <span className="flex w-full items-center justify-center">Priority</span>
    ),
    cell: ({ row }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const priority = row.getValue("priority") as string;
      const color =
        priority === "HIGH"
          ? "hover:bg-red-600 bg-red-500 text-red-800"
          : priority === "LOW"
            ? "hover:bg-yellow-400 bg-yellow-200 text-yellow-800"
            : "hover:bg-green-400 bg-foundation-green-200 text-foundation-green-800";
      return (
        <Badge
          className={cn(
            color,
            "flex w-full cursor-default items-center justify-center text-xs",
          )}
        >
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "assignee.name",
    header: () => (
      <span className="flex w-full items-center justify-center">
        Assigned To
      </span>
    ),
    cell: ({ row }) => {
      const assignee = row.original.assignee;
      return (
        <div className="flex items-center justify-center gap-2">
          <Avatar className="h-6 w-6">
            {assignee?.user.image && <AvatarImage src={assignee?.user.image} />}
            <AvatarFallback>
              {assignee?.user.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span>{assignee?.user.name ?? "Unassigned"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-center"
      >
        Start Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex w-full items-center justify-center">
        {format(new Date(row.getValue("startDate")), "PPP")}
      </span>
    ),
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-center"
      >
        End Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex w-full items-center justify-center">
        {format(new Date(row.getValue("endDate")), "PPP")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-center"
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="flex w-full items-center justify-center">
        {format(new Date(row.getValue("createdAt")), "PPP")}
      </span>
    ),
  },
];
