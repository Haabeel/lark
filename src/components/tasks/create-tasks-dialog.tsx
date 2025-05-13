"use client";

import { useDashboard } from "@/providers/DashboardProvider";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { isBefore, startOfToday } from "date-fns";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Combobox } from "../ui/combobox";
import { Input } from "../ui/input";
import { BadgePlusIcon, PlusIcon } from "lucide-react";
import { DatePickerWithPresets } from "../ui/date-picker";
import useRefetch from "@/hooks/useRefetch";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string(),
  startDate: z.date().refine((date) => !isBefore(date, startOfToday()), {
    message: "Start date cannot be before today",
  }),
  endDate: z.date().refine((date) => !isBefore(date, startOfToday()), {
    message: "End date cannot be before today",
  }),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
});

type TaskFormData = z.infer<typeof taskSchema>;
type CreateTasksDialogProps =
  | {
      className?: string;
      view: "table" | "calendar";
    }
  | {
      className?: string;
      view: "kanban";
      status: TaskStatus;
    };

const CreateTasksDialog = (props: CreateTasksDialogProps) => {
  const { className, view } = props;
  const status = view === "kanban" ? props.status : TaskStatus.TODO;
  const dashboard = useDashboard();
  const refetch = useRefetch();
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const { control, register, handleSubmit, formState, setValue, watch, reset } =
    useForm<TaskFormData>({
      resolver: zodResolver(taskSchema),
      defaultValues: {
        title: "",
        description: "",
        projectId: selectedProjectId ?? dashboard?.selectedProject,
        assigneeId: "",
        startDate: new Date(),
        endDate: new Date(),
        status: status,
        priority: TaskPriority.MEDIUM,
      },
    });
  const createTask = api.project.createTask.useMutation();
  if (!dashboard) return null;
  const { selectedProject, projects, user } = dashboard;
  const onSubmit = async (data: TaskFormData) => {
    console.log("Form submitted", data);
    try {
      const member = projects
        ?.find((project) => project.id === data.projectId)
        ?.members.find((member) => member.userId === user?.id)?.id;
      if (member === undefined) return toast.error("Something went wrong...");
      createTask.mutate(
        {
          title: data.title,
          description: data.description,
          projectId: selectedProjectId ?? selectedProject,
          assigneeId: data.assigneeId,
          priority: data.priority,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          memberId: member,
        },
        {
          onSuccess: () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            refetch();
            toast.success("Task created successfully");
            setOpen(false);
            reset();
            setSubmitted(false); // reset submission state
          },
          onError: () => {
            toast.error("Failed to create task");
          },
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {view === "table" ? (
          <Button
            size="sm"
            className={cn(
              "w-full bg-foundation-purple-400 text-neutral-100 lg:w-auto",
              className,
            )}
          >
            <PlusIcon className="size-4" />
            New
          </Button>
        ) : (
          <Button
            onClick={() => {
              console.log("clicked");
            }}
            variant="ghost"
            size="icon"
            className="size-5"
          >
            <PlusIcon className="size-4 text-neutral-700" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-none bg-neutral-300 dark:bg-foundation-blue-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-xl">
            <BadgePlusIcon className="size-6" />
            <p>Create Task</p>
          </DialogTitle>
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
          <div className="flex w-full items-center gap-2">
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-black dark:text-neutral-100">
                Project
              </label>

              <Combobox
                expanded
                items={
                  projects
                    ?.filter((project) =>
                      project.members.some(
                        (member) =>
                          member.userId === user?.id &&
                          member.role === "MAINTAINER",
                      ),
                    )
                    .map((p) => ({ label: p.name, value: p.id })) ?? []
                }
                onChangeAction={(val) => {
                  setValue("projectId", val);
                  setSelectedProjectId(val);
                  setValue("assigneeId", "");
                }}
                value={selectedProjectId ?? selectedProject}
                className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                hideAvatar
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-black dark:text-neutral-100">
                Assignee
              </label>

              <Combobox
                expanded
                items={
                  projects
                    ?.find(
                      (project) =>
                        project.id === (selectedProjectId ?? selectedProject),
                    )
                    ?.members.map((member) => ({
                      label:
                        member.user.name +
                        (member.userId === user?.id ? " (you)" : ""),
                      value: member.id,
                    })) ?? []
                }
                onChangeAction={(val) => {
                  setValue("assigneeId", val);
                }}
                value={watch("assigneeId")}
                className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                hideAvatar
                label="Select Assignee"
              />
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-black dark:text-neutral-100">
                Priority
              </label>
              <Combobox
                label="Select Priority"
                expanded
                hideAvatar
                items={Object.values(TaskPriority).map((priority) => ({
                  label: priority,
                  value: priority,
                }))}
                onChangeAction={(val) => {
                  setValue("priority", val as TaskPriority);
                }}
                value={watch("priority")}
                className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-black dark:text-neutral-100">
                Status
              </label>
              <Combobox
                label="Select Status"
                expanded
                hideAvatar
                items={Object.values(TaskStatus).map((status) => ({
                  label: status,
                  value: status,
                }))}
                onChangeAction={(val) => {
                  setValue("status", val as TaskStatus);
                }}
                value={watch("status")}
                className="h-8 w-full text-xs text-neutral-500 ring-1 ring-neutral-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <Controller
              control={control}
              name="startDate"
              render={({
                field: { onChange: onStartChange, value: startDate },
              }) => (
                <Controller
                  control={control}
                  name="endDate"
                  render={({
                    field: { onChange: onEndChange, value: endDate },
                  }) => {
                    const rangeValue =
                      startDate && endDate
                        ? { from: startDate, to: endDate }
                        : undefined;

                    return (
                      <DatePickerWithPresets
                        value={rangeValue}
                        onChange={(range) => {
                          onStartChange(range?.from ?? null);
                          onEndChange(range?.to ?? range?.from ?? null); // fallback to from if to is undefined
                        }}
                      />
                    );
                  }}
                />
              )}
            />
          </div>
          <div>
            {submitted && Object.keys(formState.errors).length > 0 && (
              <div className="space-y-1 text-sm text-red-500">
                {Object.entries(formState.errors).map(([key, error]) => (
                  <div key={key}>
                    {(error as { message?: string })?.message}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() =>
              console.log("form Data: ", formState.errors, selectedProjectId)
            }
            type="submit"
            className="w-full bg-brand-blue-400 text-neutral-100"
            disabled={formState.isLoading}
          >
            {formState.isLoading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTasksDialog;
