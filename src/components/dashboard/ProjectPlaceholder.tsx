import Link from "next/link";
import React from "react";
import Image from "next/image";

const ProjectPlaceholder = () => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 text-2xl">
      <Image
        src={"/vectors/create-project.svg"}
        height={700}
        width={700}
        alt="create project"
      />
      <div>
        <h1 className={`text-bold text-2xl`}>No Project Selected.</h1>

        <p className="text-lg text-neutral-50">
          Select a project or{" "}
          <Link
            href="/create-project"
            className="text-brand-blue-300 hover:underline"
          >
            create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ProjectPlaceholder;
