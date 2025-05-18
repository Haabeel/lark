"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDashboard } from "@/providers/DashboardProvider";
import { api } from "@/trpc/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn, initials } from "@/lib/utils";
import {
  Edit3,
  Save,
  Trash2,
  XCircle,
  Loader2,
  Github,
  Palette,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name cannot exceed 50 characters."),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),
  githubUrl: z
    .string()
    .url("Must be a valid GitHub URL.")
    .refine(
      (url) => url.startsWith("https://github.com/"),
      "URL must be a valid GitHub repository link (e.g., https://github.com/user/repo).",
    ),
  backgroundColor: z
    .string()
    .regex(
      /^hsl\(\d{1,3},\s?\d{1,3}%,\s?\d{1,3}%\)$/,
      "Must be a valid HSL color string (e.g., hsl(210, 40%, 96.1%)).",
    ),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectPage() {
  const router = useRouter();
  const dashboard = useDashboard();
  const projectId = dashboard?.selectedProject;
  const project = dashboard?.project;
  const user = dashboard?.user; // This is the authenticated user from your session

  const [isEditing, setIsEditing] = useState(false);
  const [showGithubWarningDialog, setShowGithubWarningDialog] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<ProjectFormValues | null>(null);
  const [originalGithubUrl, setOriginalGithubUrl] = useState("");

  const utils = api.useContext();

  const updateProjectMutation = api.project.updateProject.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully!");
      setIsEditing(false);
      void utils.project.getProject.invalidate({ projectId }); // Invalidate specific query
      // dashboard.refetchProject() // Or however you refetch project data in dashboard context
    },
    onError: (error) =>
      toast.error(`Failed to update project: ${error.message}`),
  });

  const archiveProjectMutation = api.project.archiveProject.useMutation({
    onSuccess: () => {
      toast.success("Project archived successfully!");
      void utils.project.getProjects.invalidate(); // Invalidate list of projects
      dashboard?.setSelectedProject(""); // Clear selected project
      router.push("/dashboard"); // Redirect to dashboard
    },
    onError: (error) =>
      toast.error(`Failed to archive project: ${error.message}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      githubUrl: "",
      backgroundColor: "hsl(210, 40%, 96.1%)",
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        githubUrl: project.githubUrl,
        backgroundColor: project.backgroundColor,
      });
      setOriginalGithubUrl(project.githubUrl);
    }
  }, [project, reset]);

  const currentMember = project?.members.find(
    (member) => member.userId === user?.id,
  );
  const canEditProject = currentMember?.role === "MAINTAINER";

  const processFormSubmit = (data: ProjectFormValues) => {
    if (!projectId) return;
    updateProjectMutation.mutate({ projectId, ...data });
  };

  const onFinalSubmit = (data: ProjectFormValues) => {
    if (data.githubUrl !== originalGithubUrl) {
      setPendingFormData(data);
      setShowGithubWarningDialog(true);
    } else {
      processFormSubmit(data);
    }
  };

  const handleConfirmGithubChangeAndSubmit = () => {
    if (pendingFormData) {
      processFormSubmit(pendingFormData);
      setPendingFormData(null);
    }
    setShowGithubWarningDialog(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (project)
      reset({
        /* ... reset to project data ... */
      });
  };

  // Color conversion functions (keep as is or move to utils)
  function hslToHex(hsl: string): string {
    const match = /hsl\(\s*(\d+),\s*(\d+)%?,\s*(\d+)%?\s*\)/i.exec(hsl);
    if (!match) return "#000000"; // fallback if format is wrong

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const rgbToHsl = (hex: string): string => {
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
  const watchedBackgroundColor = watch(
    "backgroundColor",
    project?.backgroundColor ?? "hsl(210, 40%, 96.1%)",
  );

  if (!project || !user) {
    // Improved loading/error state
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center">
        <p className="text-destructive">
          Project not found or user data unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-10 px-4 py-8 md:px-0 md:py-12">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 flex-shrink-0 items-center justify-center rounded-md text-2xl text-white"
              style={{
                backgroundColor:
                  watchedBackgroundColor ?? project.backgroundColor,
              }}
            >
              {initials(project.name)}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Manage settings and details for this project.
          </p>
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            disabled={!canEditProject}
            aria-label="Edit project details"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Edit Project
          </Button>
        ) : (
          <div className="flex gap-2 self-start sm:self-center">
            <Button
              onClick={handleSubmit(onFinalSubmit)}
              disabled={
                !isDirty || isSubmitting || updateProjectMutation.isPending
              }
              aria-label="Save changes"
            >
              {(isSubmitting || updateProjectMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button
              variant="ghost"
              onClick={cancelEditing}
              aria-label="Cancel editing"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        )}
      </header>
      <Separator />

      {/* Project Details Form */}
      <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-8">
        <Card className={cn(isEditing ? "border-primary/50 shadow-sm" : "")}>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              View and update the basic details of your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  readOnly={!isEditing}
                  className={cn(
                    !isEditing &&
                      "cursor-default border-none bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0",
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="backgroundColor"
                  className="flex items-center gap-1"
                >
                  Theme Color{" "}
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </Label>
                {isEditing ? (
                  <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <input
                      type="color"
                      id="backgroundColorPicker"
                      value={hslToHex(watchedBackgroundColor)}
                      onChange={(e) =>
                        setValue("backgroundColor", rgbToHsl(e.target.value), {
                          shouldDirty: true,
                        })
                      }
                      className="h-6 w-6 cursor-pointer appearance-none rounded-sm border-none bg-transparent outline-none"
                      aria-label="Choose background color"
                    />
                    <Input
                      id="backgroundColor"
                      {...register("backgroundColor")}
                      readOnly={!isEditing} // Technically, the text input is for display/manual HSL
                      className="border-none p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
                    <div
                      className="h-6 w-6 rounded-sm"
                      style={{ backgroundColor: project.backgroundColor }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {project.backgroundColor}
                    </span>
                  </div>
                )}
                {errors.backgroundColor && (
                  <p className="text-xs text-destructive">
                    {errors.backgroundColor.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={isEditing ? 4 : 2}
                {...register("description")}
                readOnly={!isEditing}
                className={cn(
                  !isEditing &&
                    "cursor-default resize-none border-none bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0",
                )}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* GitHub URL */}
            <div className="space-y-1.5">
              <Label htmlFor="githubUrl" className="flex items-center gap-1">
                GitHub Repository URL{" "}
                <span className="text-destructive">*</span>{" "}
                <Github className="h-4 w-4 text-muted-foreground" />
              </Label>
              <Input
                id="githubUrl"
                {...register("githubUrl")}
                readOnly={!isEditing}
                className={cn(
                  !isEditing &&
                    "cursor-default border-none bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0",
                )}
              />
              {errors.githubUrl && (
                <p className="text-xs text-destructive">
                  {errors.githubUrl.message}
                </p>
              )}
              {isEditing && (
                <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  Changing this URL will reset associated commits, AI context,
                  and saved questions.
                </p>
              )}
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t pt-6">
              <p className="text-xs text-muted-foreground">
                Fields marked with <span className="text-destructive">*</span>{" "}
                are required.
                {!canEditProject &&
                  " You do not have permission to edit this project."}
              </p>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Danger Zone - Archive Project */}
      {canEditProject && (
        <>
          <Separator />
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Proceed with caution. These actions are irreversible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium text-foreground">
                    Archive this project
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Archiving will hide the project from lists but retain its
                    data.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={archiveProjectMutation.isPending}
                    >
                      {archiveProjectMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Trash2 className="mr-2 h-4 w-4" /> Archive Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Confirm Project Archive</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to archive the project &quot;
                        {project.name}&quot;? This action cannot be easily
                        undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          archiveProjectMutation.mutate({
                            projectId: project.id,
                          })
                        }
                        disabled={archiveProjectMutation.isPending}
                      >
                        {archiveProjectMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Confirm Archive
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* GitHub URL Change Confirmation Dialog */}
      <AlertDialog
        open={showGithubWarningDialog}
        onOpenChange={setShowGithubWarningDialog}
      >
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Confirm
              GitHub URL Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              Changing the GitHub URL will{" "}
              <strong>
                delete all existing commits, saved questions, and AI context
              </strong>{" "}
              associated with this project. This action is irreversible and data
              reprocessing will begin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel
              onClick={() => {
                setShowGithubWarningDialog(false);
                setPendingFormData(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmGithubChangeAndSubmit}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm and Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
