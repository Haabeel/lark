import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { api } from "@/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export type UseProjectResult = {
  projects: inferRouterOutputs<AppRouter>["project"]["getProjects"];
  project: inferRouterOutputs<AppRouter>["project"]["getProjects"][number];
  selectedProject: string | undefined;
  setSelectedProject: (newProjectId: string) => void;
  metadata: {
    isLoading: boolean;
    isError: boolean;
  };
};

const useProject = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectIdFromParams = params?.projectId as string | undefined;

  const [localProjectId, setLocalProjectId] = useLocalStorage<
    string | undefined
  >("selectedProject", undefined);

  const {
    data: projects,
    isLoading,
    isError,
  } = api.project.getProjects.useQuery();

  const selectedProject = projectIdFromParams ?? localProjectId;

  // Sync localStorage with the param
  useEffect(() => {
    if (projectIdFromParams && projectIdFromParams !== localProjectId) {
      setLocalProjectId(projectIdFromParams);
    }
  }, [projectIdFromParams, localProjectId, setLocalProjectId]);

  const setSelectedProject = useCallback(
    (newProjectId: string) => {
      setLocalProjectId(newProjectId);

      const currentPath = pathname || "";
      const [, , , ...rest] = currentPath.split("/");
      const subPath = rest.join("/") || "project";
      router.push(`/dashboard/${newProjectId}/${subPath}`);
    },
    [pathname, router, setLocalProjectId],
  );

  const project = projects?.find((p) => p.id === selectedProject);

  return {
    projects,
    project,
    selectedProject,
    setSelectedProject,
    metadata: { isLoading, isError },
  };
};

export default useProject;
