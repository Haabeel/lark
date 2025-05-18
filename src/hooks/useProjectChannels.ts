"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useDashboard } from "@/providers/DashboardProvider";
import { type Channel } from "@prisma/client";

export const useProjectChannels = () => {
  const dashboard = useDashboard();
  const selectedProject = dashboard?.selectedProject;
  const [channels, setChannels] = useState<Channel[]>([]);
  const { data, isLoading, isError, refetch } = api.chat.getChannels.useQuery(
    { projectId: selectedProject! },
    {
      enabled: !!selectedProject, // Only run if a project is selected
    },
  );

  useEffect(() => {
    if (data) setChannels(data);
  }, [data]);

  return { channels, isLoading, isError, refetch };
};
