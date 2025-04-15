"use client";
import { useDashboard } from "@/providers/DashboardProvider";
import Image from "next/image";
import React from "react";
import CreateProjectImage from "../../../components/icons/create-project.svg";
import Link from "next/link";
import ProjectPlaceholder from "@/components/dashboard/ProjectPlaceholder";

const DashPage = () => {
  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { session, project, projects, selectedProject, setSelectedProject } =
    dashboard;
  if (!projects || projects.length === 0) return <ProjectPlaceholder />;
  return <div></div>;
};

export default DashPage;
