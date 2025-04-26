"use client";

import LogoLoader from "@/components/shared/LogoLoader";
import useProject, { type UseProjectResult } from "@/hooks/useProject";
import { type Session } from "@/lib/auth";
import { api } from "@/trpc/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, type Dispatch, type SetStateAction } from "react";

interface Props {
  children: React.ReactNode;
}
type ContextType = {
  session: Session | null | undefined;
  projects: UseProjectResult["projects"];
  project: UseProjectResult["project"];
  selectedProject: string;
  setSelectedProject: Dispatch<SetStateAction<string>>;
};

const dashboardContext = React.createContext<ContextType | null>(null);
export const useDashboard = () => React.useContext(dashboardContext);

const DashboardProvider = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading: isSessionLoading } =
    api.auth.getSession.useQuery();
  const {
    projects,
    project,
    selectedProject,
    setSelectedProject,
    metadata: { isLoading: isProjectsLoading, isError },
  } = useProject();

  const isLoading = isSessionLoading || isProjectsLoading;
  useEffect(() => {
    if (!isLoading && !projects && pathname !== "/create-project") {
      router.push("/create-project");
    }
  }, [isLoading, projects, pathname, router]);
  if (isError) {
    return <div>Something went wrong...</div>;
  }
  if (isLoading) {
    return (
      <div className="max-w-screen flex h-screen max-h-screen w-screen items-center justify-center overflow-hidden bg-white dark:bg-foundation-blue-900">
        <LogoLoader />
      </div>
    );
  }
  return (
    <dashboardContext.Provider
      value={{
        session,
        projects,
        project,
        selectedProject,
        setSelectedProject,
      }}
    >
      {children}
    </dashboardContext.Provider>
  );
};

export default DashboardProvider;
