"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import Image from "next/image";
import React from "react";
import CreateProjectImage from "../../../components/icons/create-project.svg";
import Link from "next/link";
import ProjectPlaceholder from "@/components/dashboard/ProjectPlaceholder";
import { ExternalLink, Github } from "lucide-react";
import CommitLogs from "@/components/dashboard/CommitLogs";
import AskQuestionCard from "@/components/dashboard/AskQuestionCard";
import ArchiveButton from "@/components/dashboard/ArchiveButton";
import InviteButton from "@/components/dashboard/InviteButton";
import TeamMembers from "@/components/dashboard/TeamMembers";

const DashboardPage = () => {
  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;
  if (!projects || projects.length === 0) return <ProjectPlaceholder />;
  return (
    <>
      <div className="mb-4 w-full">
        <AskQuestionCard />
      </div>
      <CommitLogs />
    </>
  );
};

export default DashboardPage;
