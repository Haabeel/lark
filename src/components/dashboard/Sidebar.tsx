"use client";

import { Combobox } from "../ui/combobox";
import { type Project } from "@prisma/client";
import { type Dispatch, type SetStateAction } from "react";
import { Separator } from "../ui/separator";

interface Props {
  project?: Project;
  projects?: Project[];
  setSelectedProject: Dispatch<SetStateAction<string>>;
  selectedProject: string;
}

const Sidebar = ({
  project,
  projects,
  setSelectedProject,
  selectedProject,
}: Props) => {
  return (
    <div className="row-span-8 flex h-full w-full flex-col border border-b-0 border-l-0 border-r-2 border-t-0 border-border">
      <section className="flex w-full items-center justify-center gap-2">
        {projects && (
          <div className="flex w-full flex-col items-center hover:bg-accent">
            <Combobox
              items={projects.map((project) => {
                return { value: project.id, label: project.name };
              })}
              value={selectedProject}
              onChangeAction={setSelectedProject}
            />
            <Separator className="w-[calc(100%-1.5rem)]" />
          </div>
        )}
      </section>
    </div>
  );
};

export default Sidebar;
