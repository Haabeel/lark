"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArchiveXIcon,
  ExternalLink,
  Github,
  LogOutIcon,
  Settings,
  UserIcon,
  WaypointsIcon,
  PanelLeftOpen, // Icon for sidebar toggle
  PanelLeftClose, // Icon for sidebar toggle
} from "lucide-react";
import { type Session } from "@/lib/auth"; // Assuming Session is your Better Auth session type
import { signOut } from "@/lib/auth-client"; // Your signOut function
import { type UseProjectResult } from "@/hooks/useProject"; // Assuming this type is correct
import useRefetch from "@/hooks/useRefetch"; // Your custom hook

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ThemeToggle from "../shared/ThemeToggle";
import TeamMembers from "./TeamMembers"; // This component also needs to be responsive
import InviteButton from "./InviteButton";
import ArchiveButton from "./ArchiveButton";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  session: Session | null | undefined;
  name: string | undefined; // Assuming this is project name or current view name
  project: UseProjectResult["project"] | null | undefined;
  isSidebarOpen?: boolean; // Prop to know current sidebar state for icon
  toggleSidebar?: () => void; // Prop to toggle the sidebar
}

const Navbar = ({
  session,
  name,
  project,
  isSidebarOpen,
  toggleSidebar,
}: Props) => {
  const router = useRouter();
  const refetch = useRefetch();
  const [isInviteOpen, setInviteOpen] = React.useState(false);
  const [isArchiveOpen, setArchiveOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      await refetch(); // Assuming this updates global state or refetches necessary data
      router.push("/sign-in"); // Redirect to sign-in after logout
      toast.success("Signed out successfully.");
    } catch (error) {
      toast.error("Error signing out. Please try again.");
      console.error("Error signing out:", error);
    }
  };

  const isMaintainer =
    project?.members.find((member) => member.userId === session?.user.id)
      ?.role === "MAINTAINER";

  return (
    <>
      <header className="flex items-center gap-2 rounded-md border border-b-2 border-sidebar-border bg-sidebar p-2 pl-2 pr-2 shadow dark:border-none dark:bg-foundation-blue-700 dark:text-neutral-100 sm:px-4 md:h-16 md:px-6">
        {/* Sidebar Toggle - visible on all screens, but more prominent on mobile */}
        {toggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-1 shrink-0" // md:hidden if you only want it on mobile/tablet
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Project GitHub Link Section */}
        <div className="hidden items-center gap-2 rounded-md bg-primary/10 p-1.5 px-2 dark:bg-primary/20 md:flex">
          <Github className="h-4 w-4 text-primary" />
          <p className="truncate text-xs font-medium text-muted-foreground">
            <span className="hidden lg:inline">Linked to:</span>
            <Link
              href={project?.githubUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center text-primary hover:underline"
              title={project?.githubUrl}
            >
              <span className="max-w-[150px] truncate xl:max-w-[250px]">
                {project?.githubUrl?.replace("https://github.com/", "") ??
                  "GitHub Repository"}
              </span>
              <ExternalLink className="ml-1 h-3.5 w-3.5 shrink-0" />
            </Link>
          </p>
        </div>

        {/* Spacer to push subsequent items to the right */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Team Members - potentially hide on very small screens or simplify */}
          <div className="hidden sm:block">
            {" "}
            {/* Hide on xs screens */}
            <TeamMembers name={name} />
          </div>
          {/* Mobile-only trigger for Team Members if hidden above */}
          {/* <Button variant="ghost" size="icon" className="sm:hidden" aria-label="View team members">
            <Users2 className="h-5 w-5" />
          </Button> */}

          <ThemeToggle />

          {/* User Avatar and Dropdown Menu */}
          {session?.user ? (
            <DropdownMenu>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full p-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={session.user.image ?? undefined}
                            alt={session.user.name ?? "User"}
                          />
                          <AvatarFallback className="bg-primary/20 text-xs">
                            {initials(
                              session.user.firstName ??
                                session.user.name ??
                                "U",
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{session.user.name || session.user.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="truncate text-sm font-medium leading-none">
                      {session.user.firstName
                        ? session.user.firstName
                        : session.user.name}
                    </p>
                    <p className="truncate text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href="/dashboard/profile"
                    className="flex w-full items-center"
                  >
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href="/dashboard/settings"
                    className="flex w-full items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isMaintainer && project && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setTimeout(() => setInviteOpen(true), 0)}
                      className="cursor-pointer"
                    >
                      <WaypointsIcon className="mr-2 h-4 w-4" /> Invite Members
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTimeout(() => setArchiveOpen(true), 0)}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <ArchiveXIcon className="mr-2 h-4 w-4" /> Archive Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Modals - ensure they are also responsive if their content is complex */}
      {project && (
        <>
          <InviteButton open={isInviteOpen} onOpenChange={setInviteOpen} />
          <ArchiveButton open={isArchiveOpen} onOpenChange={setArchiveOpen} />
        </>
      )}
    </>
  );
};

export default Navbar;
