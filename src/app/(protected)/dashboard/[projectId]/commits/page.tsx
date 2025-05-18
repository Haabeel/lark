"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import React from "react";
import ProjectPlaceholder from "@/components/dashboard/ProjectPlaceholder";
import CommitLogs from "@/components/dashboard/CommitLogs"; // Assuming correct path
import AskQuestionCard from "@/components/dashboard/AskQuestionCard"; // Assuming correct path

const CommitsPage = () => {
  const dashboard = useDashboard();
  if (!dashboard) return null; // Or a loading/error state
  const { projects } = dashboard; // Assuming projects is available from DashboardProvider

  // If there's no selected project (which CommitLogs and AskQuestionCard might depend on via useProject)
  // or if there are no projects at all, show placeholder.
  // This logic might need adjustment based on how `useProject` gets the selected project.
  if (!dashboard.selectedProject || !projects || projects.length === 0) {
    return <ProjectPlaceholder />;
  }

  return (
    // Add padding for the overall page content area
    // This padding might also be handled by the layout component that renders CommitsPage
    <div className="space-y-4 md:space-y-6">
      {" "}
      {/* Responsive vertical spacing */}
      <div className="w-full">
        <AskQuestionCard />
      </div>
      <CommitLogs />
    </div>
  );
};

export default CommitsPage;
