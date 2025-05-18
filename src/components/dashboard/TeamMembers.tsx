"use client";

import useProject from "@/hooks/useProject";
import { api } from "@/trpc/react";
import React from "react";
import { AnimatedTooltip } from "../ui/animated-tooltip";

const TeamMembers = ({ name }: { name: string | undefined }) => {
  const { selectedProject } = useProject();
  const { data: members } = api.project.getTeamMembers.useQuery(
    {
      projectId: selectedProject!,
    },
    {
      enabled: !!selectedProject,
    },
  );
  const items = members?.map((member, idx) => ({
    id: idx + 1,
    name: member.user.name === name ? name + " (you)" : member.user.name,
    designation: member.role,
    image: member.user.image,
  }));
  return (
    <div className="flex items-center gap-2">
      <AnimatedTooltip items={items ?? []} />
    </div>
  );
};

export default TeamMembers;
