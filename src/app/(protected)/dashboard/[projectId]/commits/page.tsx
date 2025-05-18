"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import React from "react";
import ProjectPlaceholder from "@/components/dashboard/ProjectPlaceholder";
import CommitLogs from "@/components/dashboard/CommitLogs";
import AskQuestionCard from "@/components/dashboard/AskQuestionCard";

const CommitsPage = () => {
  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { projects } = dashboard;
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

export default CommitsPage;
