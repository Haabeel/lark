"use client";

import useProject from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink, UserCircle } from "lucide-react"; // Added icons
import Image from "next/image"; // Use next/image
import Link from "next/link";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilteredList } from "../shared/FilteredList"; // Assuming this component is responsive
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import NotFoundImage from "../shared/NotFoundImage";
import { format, formatDistanceToNowStrict } from "date-fns"; // For better date formatting
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type Commit = inferRouterOutputs<AppRouter>["project"]["getCommits"][number];

const CommitLogs = () => {
  const { selectedProject: projectId, project } = useProject();
  const { data: commits, isLoading: isLoadingCommits } =
    api.project.getCommits.useQuery(
      // Added isLoading
      { projectId: projectId! },
      { enabled: !!projectId },
    );

  const getChangeCount = (commit: Commit) => {
    if (!commit.summary) return 0;
    return commit.summary
      .split("\n")
      .filter(
        (line) =>
          line.trim().startsWith("*") ||
          line.trim().startsWith("- [") ||
          line.trim().startsWith("+ ["),
      ).length; // More robust change detection
  };

  // Use isLoadingCommits for Skeleton state
  if (isLoadingCommits && !commits) {
    // Show skeletons only if loading and no data yet
    return (
      <ul className="space-y-4 md:space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="relative flex gap-x-3 sm:gap-x-4">
            <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
              <div className="w-px translate-x-[11px] bg-border sm:translate-x-1" />{" "}
              {/* Adjusted for avatar size */}
            </div>
            <Skeleton className="relative mt-1 h-7 w-7 flex-none rounded-full sm:h-8 sm:w-8" />
            <div className="flex-auto rounded-md border bg-card p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-3 w-16 self-start rounded-md sm:self-center" />
              </div>
              <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
              <Skeleton className="mt-2 h-3 w-full rounded-md" />
              <Skeleton className="mt-1 h-3 w-5/6 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // FilteredList should ideally handle its own empty/no-commits state, but this is a fallback
  if (!commits || commits.length === 0) {
    return <NotFoundImage text="No commits found for this project yet." />;
  }
  return (
    <div className="flow-root">
      {" "}
      {/* Use flow-root to contain floats if any children use them */}
      <ul className="-mb-4 space-y-4 md:-mb-6 md:space-y-6">
        {" "}
        {/* Negative margin for timeline effect */}
        <FilteredList
          items={commits}
          getTitle={(c) => c.commitMessage}
          getAuthor={(c) => c.commitAuthorName}
          getDate={(c) => new Date(c.commitDate)}
          getChangeCount={getChangeCount}
          showChangeSort // Assuming this exists and works
          emptyState={
            <NotFoundImage text="No commits matched your search or filters." />
          }
          renderItem={(commit, index) => (
            <li key={commit.id} className="relative flex gap-x-3 sm:gap-x-4">
              <div
                className={cn(
                  "absolute left-0 top-0 flex w-6 justify-center",
                  index === commits.length - 1
                    ? "h-[calc(1.75rem+1px)] sm:h-[calc(2rem+1px)]"
                    : "-bottom-4 md:-bottom-6", // Adjust height for last item
                )}
              >
                {/* Timeline line, adjusted positioning */}
                <div className="w-px translate-x-[11px] bg-border sm:translate-x-1" />
              </div>
              <div className="relative mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-card sm:h-8 sm:w-8">
                {/* Avatar with fallback */}
                {commit.commitAuthorAvatar ? (
                  <Image
                    src={commit.commitAuthorAvatar}
                    alt={commit.commitAuthorName || "Committer"}
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
                )}
                {/* Dot on timeline */}
                <div className="absolute -left-[calc(0.75rem-1px)] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full border-2 border-background bg-primary ring-1 ring-primary sm:-left-[calc(1rem-1px)] sm:h-2 sm:w-2"></div>
              </div>

              <div className="flex-auto rounded-md border bg-card p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                    <span className="font-semibold text-foreground">
                      {commit.commitAuthorName || "Unknown Author"}
                    </span>
                    <span className="text-muted-foreground">committed</span>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <time
                            dateTime={format(commit.commitDate, "PPPppp")}
                            className="text-muted-foreground"
                          >
                            {formatDistanceToNowStrict(
                              new Date(commit.commitDate),
                              { addSuffix: true },
                            )}
                          </time>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(commit.commitDate), "PPPppp")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Link
                    target="_blank"
                    href={`${project?.githubUrl}/commit/${commit.commitHash}`} // Corrected link
                    className="group inline-flex items-center self-start text-xs text-primary hover:underline sm:self-center"
                  >
                    View on GitHub{" "}
                    <ExternalLink className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <h3
                  className="mt-1.5 text-sm font-semibold text-foreground sm:text-base"
                  title={commit.commitMessage}
                >
                  {commit.commitMessage}
                </h3>
                {commit.summary && (
                  <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground dark:text-gray-400 sm:text-sm">
                    {commit.summary}
                  </pre>
                )}
                {/* Optional: Change Count Badge */}
                {/* <Badge variant="outline" className="mt-2 text-xs">
                  {getChangeCount(commit)} changes
                </Badge> */}
              </div>
            </li>
          )}
        />
      </ul>
    </div>
  );
};

export default CommitLogs;
