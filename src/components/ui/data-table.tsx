"use client";
import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./context-menu";
import { type User } from "@/providers/DashboardProvider";
import { type Column } from "../tasks/columns";
import EditTaskDialog from "../tasks/EditTaskDialog";
import { DeleteTaskDialog } from "../tasks/DeleteTaskDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Delete, Edit3Icon } from "lucide-react";
import DisplayTaskDialog from "../tasks/ViewTaskDialog";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  user: User;
  selectedProject: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  user,
  selectedProject,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Column | null>(null);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });
  return (
    <div>
      <div className="flex flex-wrap gap-4 py-4">
        <Input
          placeholder="Search by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-foundation-blue-800"
                      onClick={() => {
                        setTimeout(() => {
                          setSelectedTask(row.original as Column);
                          setViewDialogOpen(true);
                        }, 0);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={`text-xs`}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {user.memberships.find(
                      (member) => member.projectId === selectedProject,
                    )?.role === "MAINTAINER" ? (
                      <>
                        <ContextMenuItem
                          onClick={() =>
                            setTimeout(() => {
                              setSelectedTask(row.original as Column);
                              setEditDialogOpen(true);
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
                              setSelectedTask(row.original as Column);
                              setDeleteDialogOpen(true);
                            }, 0)
                          }
                          className="flex items-center justify-between text-xs text-red-600"
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
                                className="flex items-center justify-center text-xs text-red-600 opacity-70"
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selectedTask && (
        <>
          <EditTaskDialog
            open={editDialogOpen}
            onOpenAction={(
              open: boolean | ((prevState: boolean) => boolean),
            ) => {
              if (!open) {
                setSelectedTask(null);
              }
              setEditDialogOpen(open);
            }}
            task={selectedTask}
          />
          <DeleteTaskDialog
            open={deleteDialogOpen}
            onOpenAction={(isOpen) => {
              if (!isOpen) {
                setSelectedTask(null);
              }
              setDeleteDialogOpen(isOpen);
            }}
            task={selectedTask}
          />
          <DisplayTaskDialog
            task={selectedTask}
            open={viewDialogOpen}
            onOpenAction={setViewDialogOpen}
          />
        </>
      )}
    </div>
  );
}
