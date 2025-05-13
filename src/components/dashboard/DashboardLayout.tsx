"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { useDashboard } from "@/providers/DashboardProvider";
import React from "react";
import AppSidebar from "./AppSidebar";
import Navbar from "./Navbar";
import ProjectPlaceholder from "./ProjectPlaceholder";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

const SidebarContent = ({ children }: Props) => {
  const dashboard = useDashboard();
  const pathname = usePathname();

  if (!dashboard) return null;

  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;
  const name = session?.user.name;
  const shouldShowPlaceholder =
    !pathname.startsWith("/create-project") &&
    (!projects || projects.length === 0 || selectedProject === "");
  return (
    <SidebarProvider className="overflow-hidden dark:bg-foundation-blue-900 dark:text-neutral-100">
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
      />
      <main className="my-2 ml-2 mr-2 flex h-full w-full flex-col gap-2 md:ml-0">
        <Navbar name={name} session={session} project={project} />
        <div className="h-[calc(100vh-5rem)] overflow-y-auto rounded-md border border-sidebar-border bg-sidebar p-4 shadow dark:border-none dark:bg-foundation-blue-700">
          {shouldShowPlaceholder ? <ProjectPlaceholder /> : children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SidebarContent;
