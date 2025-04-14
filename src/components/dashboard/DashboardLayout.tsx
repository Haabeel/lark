"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { initials } from "@/lib/utils";
import { useDashboard } from "@/providers/DashboardProvider";
import React, { useMemo } from "react";
import AppSidebar from "./AppSidebar";
import Navbar from "./Navbar";

type Props = {
  children: React.ReactNode;
};

const SidebarContent = ({ children }: Props) => {
  const dashboard = useDashboard();
  const [hasFetchingError, setHasFetchingError] = React.useState(false);
  if (!dashboard) return null;

  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;
  const name = initials(session?.user.name ?? "");
  return (
    <SidebarProvider className="overflow-hidden dark:bg-foundation-blue-900 dark:text-neutral-100">
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
      />
      <main className="my-2 mr-2 flex h-full w-full flex-col gap-2">
        <Navbar
          name={name}
          hasFetchingError={hasFetchingError}
          session={session}
          setHasFetchingError={setHasFetchingError}
        />
        <div className="h-[calc(100vh-5rem)] overflow-y-auto rounded-md border border-sidebar-border bg-sidebar p-4 shadow dark:border-none dark:bg-foundation-blue-700">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default SidebarContent;
