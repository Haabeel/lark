"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import { api } from "@/trpc/react";
import { useState } from "react";

interface Channel {
  id: string;
  name: string;
}

const ChannelList = () => {
  const dashboard = useDashboard();
  const projectId = dashboard?.selectedProject;
  const { data: channels, isLoading } = api.chat.getChannels.useQuery({
    projectId: projectId ?? "",
  });
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );

  if (isLoading) return <div>Loading channels...</div>;

  return (
    <div>
      <h3>Channels</h3>
      <ul>
        {channels?.map((channel) => (
          <li key={channel.id} onClick={() => setSelectedChannelId(channel.id)}>
            {channel.name}
          </li>
        ))}
      </ul>
      {/* Render ChannelDisplay component here, passing selectedChannelId */}
    </div>
  );
};

export default ChannelList;
