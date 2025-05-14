"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDashboard } from "@/providers/DashboardProvider";
import { api } from "@/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  githubUrl: z.string().url("Must be a valid URL"),
  backgroundColor: z
    .string()
    .regex(
      /^hsl\(\d{1,3},\s?\d{1,3}%,\s?\d{1,3}%\)$/,
      "Must be a valid HSL color",
    ),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectPage() {
  const dashboard = useDashboard();
  const projectId = dashboard?.selectedProject;
  const project = dashboard?.project;
  const user = dashboard?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [showGithubWarning, setShowGithubWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ProjectForm | null>(
    null,
  );
  const [originalGithubUrl, setOriginalGithubUrl] = useState("");
  const updateProject = api.project.updateProject.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      setIsEditing(false);
    },
    onError: () => toast.error("Failed to update project"),
  });

  const archiveProject = api.project.archiveProject.useMutation({
    onSuccess: () => toast.success("Project archived"),
    onError: () => toast.error("Failed to archive project"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        githubUrl: project.githubUrl,
        backgroundColor: project.backgroundColor,
      });
      setOriginalGithubUrl(project.githubUrl); // store original
    }
  }, [project, reset]);

  const onSubmit = (data: ProjectForm) => {
    if (!projectId) return;

    if (data.githubUrl !== originalGithubUrl) {
      setPendingFormData(data); // store data
      setShowGithubWarning(true); // open dialog
      return; // halt update until confirmed
    }
    updateProject.mutate({ projectId, ...data });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        githubUrl: project.githubUrl,
        backgroundColor: project.backgroundColor,
      });
    }
  };

  function hslToHex(hsl: string): string {
    const match = /hsl\(\s*(\d+),\s*(\d+)%?,\s*(\d+)%?\s*\)/i.exec(hsl);
    if (!match) return "#000000"; // fallback if format is wrong

    const [_, hStr, sStr, lStr] = match;
    if (!hStr || !sStr || !lStr) return "#000000"; // fallback if format is wrong
    const h = parseInt(hStr, 10);
    const s = parseInt(sStr, 10) / 100;
    const l = parseInt(lStr, 10) / 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };

    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const rgbToHsl = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
      l * 100,
    )}%)`;
  };
  const watchedColor = watch("backgroundColor");
  // if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!project || !user)
    return (
      <div className="p-8 text-center text-red-500">Project not found.</div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Project Details</CardTitle>
          {!isEditing ? (
            <Button
              variant="secondary"
              disabled={
                project?.members.find((member) => member.userId === user.id)
                  ?.role === "CONTRIBUTOR"
              }
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty}>
                Save
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <Input
                  {...register("name")}
                  readOnly={!isEditing}
                  className={cn(
                    isEditing ? "pointer-events-auto" : "pointer-events-none",
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <Textarea
                  rows={4}
                  {...register("description")}
                  readOnly={!isEditing}
                  className={cn(
                    isEditing ? "pointer-events-auto" : "pointer-events-none",
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">GitHub URL</label>
                <Input
                  {...register("githubUrl")}
                  readOnly={!isEditing}
                  className={cn(
                    isEditing ? "pointer-events-auto" : "pointer-events-none",
                  )}
                />
                {errors.githubUrl && (
                  <p className="text-sm text-red-500">
                    {errors.githubUrl.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Background Color
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={hslToHex(watchedColor)}
                      onChange={(e) => {
                        const hsl = rgbToHsl(e.target.value); // convert picked hex to HSL
                        setValue("backgroundColor", hsl, { shouldDirty: true });
                      }}
                      className="w-full cursor-pointer appearance-none rounded border-none outline-none"
                    />
                  </div>
                ) : (
                  <div
                    className="h-10 w-full rounded border"
                    style={{
                      backgroundColor: project.backgroundColor,
                    }}
                  />
                )}
                {errors.backgroundColor && (
                  <p className="text-sm text-red-500">
                    {errors.backgroundColor.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Archive Project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Archive</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to archive this project? This cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => archiveProject.mutate({ projectId: project.id })}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showGithubWarning} onOpenChange={setShowGithubWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Changing the GitHub URL will <strong>delete all commits</strong>,{" "}
            <strong>saved questions</strong>, and <strong>AI context</strong>{" "}
            associated with this project. This action is irreversible.
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowGithubWarning(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!projectId || !pendingFormData) return;
                updateProject.mutate({ projectId, ...pendingFormData });
                setShowGithubWarning(false);
                setPendingFormData(null);
              }}
            >
              Confirm and Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
