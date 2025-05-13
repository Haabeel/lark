import React from "react";
import Image from "next/image";
import { CreateProjectForm } from "@/components/CreateProject";

const CreateProject = () => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-10 px-36">
      <CreateProjectForm />
      <Image
        src={"/vectors/version-control.svg"}
        width={400}
        height={500}
        className="h-[150px] w-auto md:h-[280px]"
        alt="version control"
      />
    </div>
  );
};

export default CreateProject;
