"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useProgress } from "@/providers/ProgressProvider";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL"),
  githubToken: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const progress = useProgress();
  const setProjectId = progress?.setProjectId;
  const progressData = progress?.progress;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      githubUrl: "",
      githubToken: "",
    },
  });

  const createMutation = api.project.createProject.useMutation({
    onSuccess: (project) => {
      if (setProjectId) setProjectId(project.id);
      if (progressData?.progress && progressData.progress >= 100)
        router.push(`/dashboard/${project.id}`);
    },
    onError: () => {
      toast.error("Failed to create project. Please try again.");
      setLoading(false);
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await createMutation.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center gap-10 px-36">
      <div className="w-full max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-2xl font-bold">Create Project</h1>
            {/* <p className="text-sm text-muted-foreground"> */}
            {/*   {loading */}
            {/*     ? steps[stepIndex] */}
            {/*     : "Let’s set up your new project in Lark."} */}
            {/* </p> */}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Project description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Repository URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/username/repo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Token (for private repos)</FormLabel>
                  <FormControl>
                    <Input placeholder="ghp_xxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loading && (
              <div className="space-y-2">
                <Progress
                  value={progressData ? progressData?.progress / 100 : 0}
                  className="h-2"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Project..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </div>
      <Image
        src="/vectors/version-control.svg"
        alt="version control"
        width={400}
        height={500}
        className="hidden h-[280px] w-auto md:block"
      />
    </div>
  );
}
