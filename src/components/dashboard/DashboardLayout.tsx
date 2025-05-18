"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useDashboard } from "@/providers/DashboardProvider";
import React from "react"; // React.useMemo is part of React
import AppSidebar from "@/components/dashboard/sidebar/AppSidebar";
import Navbar from "./Navbar";
import ProjectPlaceholder from "./ProjectPlaceholder";
import { usePathname } from "next/navigation";
import { useProjectChannels } from "@/hooks/useProjectChannels";
import { api } from "@/trpc/react";
import { useUserDms } from "@/hooks/useUserDms";

type Props = {
  children: React.ReactNode;
};

const SidebarContent = ({ children }: Props) => {
  const dashboard = useDashboard();
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  // This hook fetches all channels for the selected project
  const { channels: allProjectChannels, isLoading: isProjectChannelsLoading } =
    useProjectChannels();
  const { channels: allUserDms } = useUserDms();
  // Session and project data are needed for the tRPC query's userId and potentially for AppSidebar
  const currentUserId = dashboard?.session?.user?.id; // Get userId before the early return

  // Fetch the list of channel IDs the current user is explicitly a member of
  const {
    data: userMemberChannelIdsData,
    isLoading: isLoadingUserMemberChannels,
  } = api.chat.getAllUserChannelIds.useQuery(
    { userId: currentUserId! },
    {
      enabled: !!currentUserId && !!dashboard?.selectedProject, // Also ensure a project is selected if the query depends on it implicitly
    },
  );

  // Filter the project channels to include only those the user is a member of
  // This hook is now called unconditionally at the top level
  const filteredChannels = React.useMemo(() => {
    // If dashboard isn't ready, or other data is loading, or data isn't available yet, return empty.
    if (
      !dashboard || // Check dashboard here as well since subsequent logic depends on it
      isProjectChannelsLoading ||
      isLoadingUserMemberChannels ||
      !allProjectChannels ||
      !userMemberChannelIdsData
    ) {
      return [];
    }
    return allProjectChannels.filter((channel) =>
      userMemberChannelIdsData
        .map((channel) => channel.channelId)
        .includes(channel.id),
    );
  }, [
    dashboard, // Add dashboard as a dependency
    allProjectChannels,
    userMemberChannelIdsData,
    isProjectChannelsLoading,
    isLoadingUserMemberChannels,
  ]);

  // Early return if dashboard is not yet available
  if (!dashboard) {
    // You might want to return a loading skeleton here instead of null
    // if the sidebar structure itself should be visible during load
    return null;
  }

  // Destructure dashboard properties after the null check
  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;

  const isChannelRoute = /\/channel\/[^/]+$/.test(pathname);
  const paddingClass = isChannelRoute ? "p-0" : "p-4";
  const name = session?.user.name;
  const shouldShowPlaceholder =
    !pathname.startsWith("/create-project") &&
    (!projects || projects.length === 0 || !selectedProject);

  return (
    <>
      <AppSidebar
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        channels={filteredChannels}
        dms={allUserDms}
      />
      <main className="flex h-full w-full flex-col gap-2">
        <Navbar
          name={name}
          session={session}
          project={project}
          isSidebarOpen={open}
          toggleSidebar={toggleSidebar}
        />
        <div
          className={`h-[calc(100vh-5rem)] overflow-y-auto rounded-md border border-sidebar-border bg-sidebar ${paddingClass} shadow dark:border-none dark:bg-foundation-blue-700`}
        >
          {shouldShowPlaceholder ? <ProjectPlaceholder /> : children}
        </div>
      </main>
    </>
  );
};

export default SidebarContent;
