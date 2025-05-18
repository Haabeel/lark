"use client";

import LogoLoader from "@/components/shared/LogoLoader";
import useProject from "@/hooks/useProject";
import { type Session } from "@/lib/auth";
import { type AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import { type Prisma } from "@prisma/client";
import { type inferRouterOutputs } from "@trpc/server";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export type User = Prisma.UserGetPayload<{
  include: {
    accounts: true;
    memberships: true;
    projects: true;
    questionsAsked: true;
    sessions: true;
  };
}>;

type ContextType = {
  session: Session | null | undefined;
  user: User | null | undefined;
  projects: inferRouterOutputs<AppRouter>["project"]["getProjects"] | undefined;
  project:
    | inferRouterOutputs<AppRouter>["project"]["getProjects"][number]
    | undefined;
  selectedProject: string;
  setSelectedProject: (newProjectId: string) => void;
};

const dashboardContext = React.createContext<ContextType | null>(null);
export const useDashboard = () => React.useContext(dashboardContext);

const DashboardProvider = ({ children }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading: isSessionLoading } =
    api.auth.getSession.useQuery();
  const { data: user } = api.user.getUser.useQuery();
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
        user,
        projects,
        project,
        selectedProject: selectedProject ?? "",
        setSelectedProject,
      }}
    >
      {children}
    </dashboardContext.Provider>
  );
};

export default DashboardProvider;
