"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormInputField from "@/components/shared/FormInputField"; // Your custom component
import { useState } from "react";
import { toast } from "sonner";
import { FolderKey, Key } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL"),
  githubToken: z.string().optional(),
});

export function CreateProjectForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      githubUrl: "",
      githubToken: "",
    },
  });

  const { mutateAsync: createProject } =
    api.project.createProject.useMutation();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await createProject(values);
      toast.success("Project created successfully.");
    } catch (error) {
      toast.error("Something went wrong...");
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* <div className="flex w-full flex-1 flex-col items-center justify-center rounded-lg sm:max-w-min"> */}
      <Form {...form}>
        <div className="flex w-full flex-col">
          <div className="flex flex-col gap-1">
            <h1 className="w-full text-xl font-semibold">Create Project</h1>
            <p className="mb-10 w-full text-neutral-500 dark:text-neutral-50">
              Let&apos;s set up your new project in Lark.
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col items-center justify-center gap-3"
          >
            <FormInputField
              control={form.control}
              name="name"
              label="Project Name"
              placeholder="My Awesome Project"
            />

            <FormInputField
              control={form.control}
              name="githubUrl"
              label="GitHub Repository URL"
              placeholder="https://github.com/username/repository"
              type="url"
            />

            <FormInputField
              control={form.control}
              name="githubToken"
              label="GitHub Token - For private Repositories"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              icon={<FolderKey className="h-4 w-auto" />}
            />

            <Button
              type="submit"
              className="mt-2 w-full bg-brand-blue-800 dark:bg-brand-blue-400"
              disabled={loading}
            >
              {loading ? "Creating Project..." : "Create Project"}
            </Button>
          </form>
        </div>
      </Form>
      {/* </div> */}
    </>
  );
}
