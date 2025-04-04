import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";

const useProject = () => {
  const {
    data: projects,
    isLoading,
    isError,
  } = api.project.getProjects.useQuery();
  const [selectedProject, setSelectedProject] = useLocalStorage(
    "selectedProject",
    "",
  );
  const project = projects?.find((project) => project.id === selectedProject);
  return {
    projects,
    project,
    selectedProject,
    setSelectedProject,
    metadata: { isLoading, isError },
  };
};

export default useProject;
