"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react"; // client-side trpc

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { data: projects, isLoading } = api.project.getProjects.useQuery();

  useEffect(() => {
    if (isLoading || !projects) return;

    const raw = localStorage.getItem("selectedProject");
    const storedProjectId = raw ? (JSON.parse(raw) as string) : null;

    console.log("Stored Project ID:", storedProjectId);
    console.log(
      "Available Projects:",
      projects.map((p) => p.id),
    );

    const matchedProject = projects.find((p) => p.id === storedProjectId);

    if (storedProjectId && matchedProject) {
      router.replace(`/dashboard/${storedProjectId}/analytics`);
    } else if (projects[0]) {
      router.replace(`/dashboard/${projects[0].id}/analytics`);
    } else {
      router.replace("/dashboard/create-project");
    }
  }, [projects, isLoading, router]);

  return null; // optional: you can show a loading spinner
}
