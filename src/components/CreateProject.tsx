"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import FormInputField from "@/components/shared/FormInputField"; // Your custom component

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL"),
  githubToken: z.string().optional(),
});

export function CreateProjectForm() {
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
      await createProject(values);
      // Handle success
    } catch (error) {
      console.error("Error creating project:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormInputField
          control={form.control}
          name="name"
          label="Project Name"
          placeholder="My Awesome Project"
        />

        <FormInputField
          control={form.control}
          name="description"
          label="Description"
          placeholder="Project description (optional)"
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
          label="GitHub Token (Optional)"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          type="password"
        />

        <Button type="submit">Create Project</Button>
      </form>
    </Form>
  );
}
