import React from "react";
import { type Session } from "@/lib/auth";
import TeamMembers from "./TeamMembers";
import {
  ArchiveXIcon,
  ExternalLink,
  Github,
  LogOutIcon,
  Settings,
  UserIcon,
  WaypointsIcon,
} from "lucide-react";
import Link from "next/link";
import InviteButton from "./InviteButton";
import ArchiveButton from "./ArchiveButton";
import { type UseProjectResult } from "@/hooks/useProject";
import ThemeToggle from "../shared/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { initials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import useRefetch from "@/hooks/useRefetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface Props {
  session: Session | null | undefined;
  name: string | undefined;
  project: UseProjectResult["project"] | null | undefined;
}

const Navbar = ({ name, session, project }: Props) => {
  const router = useRouter();
  const refetch = useRefetch();
  const [isInviteOpen, setInviteOpen] = React.useState(false);
  const [isArchiveOpen, setArchiveOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      await refetch();
      router.push("/sign-in");
    } catch (error) {
      toast.error("Error signing out. Please try again.");
      console.error("Error signing out:", error);
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-md border border-b-2 border-sidebar-border bg-sidebar p-2 pl-2 pr-2 shadow dark:border-none dark:bg-foundation-blue-700 dark:text-neutral-100">
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
        </div>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8">
              {session?.user.image ? (
                <AvatarImage src={session?.user.image} />
              ) : (
                <AvatarFallback>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foundation-purple-300 dark:bg-foundation-purple-700">
                    {initials(session?.user.name ?? "")}
                  </div>
                </AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-2 mt-2 w-48">
            <DropdownMenuLabel className="flex flex-col">
              <p>{session?.user.name}</p>
              <p className="text-[13px] font-normal text-foundation-neutral-400">
                {session?.user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
              <Link
                href={`/dashboard/profile`}
                className="flex w-full items-center gap-2"
              >
                <UserIcon />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
              <Link
                href={`/dashboard/settings`}
                className="flex w-full items-center gap-2"
              >
                <Settings />
                <span> Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {project?.members.find(
              (member) => member.userId === session?.user.id,
            )?.role === "MAINTAINER" && (
              <>
                <DropdownMenuItem
                  onClick={() => setTimeout(() => setInviteOpen(true), 0)}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <WaypointsIcon />
                  <span> Invite Members</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTimeout(() => setArchiveOpen(true), 0)}
                  className="text flex cursor-pointer items-center gap-2 text-foundation-red-500"
                >
                  <ArchiveXIcon />
                  <span> Archive Project</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-2 text-foundation-red-500"
            >
              <LogOutIcon />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <InviteButton open={isInviteOpen} onOpenChange={setInviteOpen} />
      <ArchiveButton open={isArchiveOpen} onOpenChange={setArchiveOpen} />

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
