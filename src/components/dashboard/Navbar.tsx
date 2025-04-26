import React from "react";
import { type Session } from "@/lib/auth";
import TeamMembers from "./TeamMembers";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import InviteButton from "./InviteButton";
import ArchiveButton from "./ArchiveButton";
import { type UseProjectResult } from "@/hooks/useProject";
import ThemeToggle from "../shared/ThemeToggle";
interface Props {
  session: Session | null | undefined;
  name: string | undefined;
  project: UseProjectResult["project"] | null | undefined;
}

const Navbar = ({ name, session, project }: Props) => {
  return (
    <div className="flex items-center gap-2 rounded-md border border-b-2 border-sidebar-border bg-sidebar p-2 px-4 shadow dark:border-none dark:bg-foundation-blue-700 dark:text-neutral-100">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="w-fit rounded-md bg-brand-blue-500 p-2">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-xs font-medium text-neutral-100">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-xs text-neutral-200 hover:underline"
                >
                  {project?.githubUrl}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="ml-auto"></div>
        <div className="mr-3 flex items-center justify-center gap-6">
          <TeamMembers name={name} />
          {project?.members.find((member) => member.id === session?.user.id)
            ?.role === "MAINTAINER" && (
            <div className="items center flex gap-2">
              <InviteButton />
              <ArchiveButton />
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>
      {/* <div className="ml-auto"></div> */}
      {/* <Avatar>
        {session?.user.image && hasFetchingError ? (
          <AvatarImage
            src={session?.user.image}
            key={session.user.id}
            onError={() => setHasFetchingError(true)}
          />
        ) : (
          <AvatarFallback className="bg-foundation-purple-300 dark:bg-foundation-purple-700">
            {name}
          </AvatarFallback>
        )}
      </Avatar> */}
    </div>
  );
};

export default Navbar;
