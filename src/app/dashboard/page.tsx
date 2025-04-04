"use client";

import MainContent from "@/components/dashboard/MainContent";
import Navbar from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import React from "react";
import useProject from "../../hooks/useProject";
import LogoLoader from "@/components/shared/LogoLoader";

const Dashboard = () => {
  const {
    project,
    projects,
    setSelectedProject,
    selectedProject,
    metadata: { isLoading, isError },
  } = useProject();
  return (
    <div className="grid h-full w-full flex-1 grid-cols-6 grid-rows-8 gap-0 bg-white">
      {!isLoading ? (
        <>
          <Sidebar
            project={project}
            projects={projects}
            setSelectedProject={setSelectedProject}
            selectedProject={selectedProject}
          />
          <Navbar />
          <MainContent />
        </>
      ) : (
        <div className="col-span-6 row-span-8 flex h-full w-full items-center justify-center">
          <LogoLoader />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
