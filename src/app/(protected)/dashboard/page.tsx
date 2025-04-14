"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import Image from "next/image";
import React from "react";
import CreateProjectImage from "../../../components/icons/create-project.svg";

const DashPage = () => {
  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;
  if (!projects || projects.length === 0)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-2xl">
        <CreateProjectImage />
        <h1 className={`text-bold text-2xl`}>No Project Selected.</h1>
        <p className="text-lg text-neutral-50">
          Select a project or create one
        </p>
      </div>
    );
  return <div></div>;
};

export default DashPage;
