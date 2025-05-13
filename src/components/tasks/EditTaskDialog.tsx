"use client";

import * as React from "react";
import { useDashboard } from "@/providers/DashboardProvider";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Combobox } from "../ui/combobox";
import { Input } from "../ui/input";
import { DatePickerWithPresets } from "../ui/date-picker";
import useRefetch from "@/hooks/useRefetch";
import { type Column } from "./columns";
import { Textarea } from "../ui/textarea";

// Zod schema for editing a task
const editTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

interface EditTaskDialogProps {
  open: boolean;
  onOpenAction: (open: boolean) => void;
  task: Column;
}

export default function EditTaskDialog({
  open,
  onOpenAction,
  task,
}: EditTaskDialogProps) {
  const dashboard = useDashboard();
  const refetch = useRefetch();
  const updateTask = api.project.updateTask.useMutation();
  const [internalOpen, setInternalOpen] = React.useState(open);
  const [isLoading, setIsLoading] = React.useState(false);
  const { formState, register, handleSubmit, control, setValue, reset } =
    useForm<EditTaskFormData>({
      resolver: zodResolver(editTaskSchema),
      defaultValues: {
        title: task.title,
        description: task.description ?? "",
        assigneeId: task.assigneeId!,
        startDate: task.startDate,
        endDate: task.endDate,
        status: task.status,
        priority: task.priority,
      },
    });

  const onSubmit = async (data: EditTaskFormData) => {
    console.log("Validation Errors:", formState.errors);
    try {
      setIsLoading(true);
      updateTask.mutate(
        {
          taskId: task.id,
          title: data.title,
          description: data.description,
          assigneeId: data.assigneeId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          priority: data.priority,
        },
        {
          onSuccess: () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            refetch();
            toast.success("Task updated successfully");
            setIsLoading(false);
            onOpenAction(false);
          },
          onError: () => {
            toast.error("Failed to update task");
          },
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      const defaultData = {
        title: task.title,
        description: task.description ?? "",
        assigneeId: task.assigneeId!,
        startDate: task.startDate,
        endDate: task.endDate,
        status: task.status,
        priority: task.priority,
      };

      reset(defaultData); // Sets defaults internally

      // Manually set and trigger validations to ensure fields are "registered"
      for (const [key, value] of Object.entries(defaultData)) {
        // @ts-expect-error dynamic key assignment
        setValue(key, value, { shouldDirty: false, shouldValidate: true });
      }

      setIsLoading(false);
    }
  }, [open, task, reset, setValue]);

  React.useEffect(() => {
    // Only update internal state if the prop changes
    if (open !== internalOpen) {
      setInternalOpen(open);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!dashboard) return null;
  const { project } = dashboard;

  return (
    <Dialog open={open} onOpenChange={onOpenAction}>
      <DialogContent className="border-none bg-neutral-300 dark:bg-foundation-blue-800">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="Title"
            {...register("title")}
            className="border border-neutral-700 text-neutral-500 placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-100"
          />
          <Textarea
            placeholder="Description"
            {...register("description")}
            className="resize-x-none max-h-32 border border-neutral-700 text-neutral-500 placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-100"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm">Assignee</label>
              <label className="text-sm">Priority</label>
              <Controller
                control={control}
                name="assigneeId"
                render={({ field }) => (
                  <Combobox
                    items={
                      project?.members.map((member) => {
                        return {
                          label: member.user.name,
                          value: member.id,
                        };
                      }) ?? []
                    }
                    value={field.value}
                    onChangeAction={(val) => field.onChange(val)}
                    className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    hideAvatar
                    expanded
                  />
                )}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm">Priority</label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Combobox
                    items={Object.values(TaskPriority).map((p) => ({
                      label: p,
                      value: p,
                    }))}
                    value={field.value}
                    onChangeAction={(val) => field.onChange(val)}
                    className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    hideAvatar
                    expanded
                  />
                )}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm">Status</label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Combobox
                    items={Object.values(TaskStatus).map((s) => ({
                      label: s,
                      value: s,
                    }))}
                    value={field.value}
                    onChangeAction={(val) => field.onChange(val)}
                    className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    hideAvatar
                    expanded
                  />
                )}
              />
            </div>
          </div>
          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange: onStart, value: startDate } }) => (
              <Controller
                control={control}
                name="endDate"
                render={({ field: { onChange: onEnd, value: endDate } }) => {
                  const range =
                    startDate && endDate
                      ? { from: startDate, to: endDate }
                      : undefined;
                  return (
                    <DatePickerWithPresets
                      value={range}
                      onChange={(r) => {
                        onStart(r?.from ?? startDate);
                        onEnd(r?.to ?? r?.from ?? endDate);
                      }}
                    />
                  );
                }}
              />
            )}
          />
          {formState.errors.title && (
            <p className="text-red-500">{formState.errors.title.message}</p>
          )}
          <Button
            type="submit"
            onClick={() => console.log(formState.errors)}
            className={`w-full bg-brand-blue-400 text-neutral-100 ${isLoading ? "opacity-50 hover:bg-brand-blue-400" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
