"use client";

import useProject from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilteredList } from "../shared/FilteredList";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import NotFoundImage from "../shared/NotFoundImage";
type Commit = inferRouterOutputs<AppRouter>["project"]["getCommits"][number];
const CommitLogs = () => {
  const { selectedProject: projectId, project } = useProject();
  const { data: commits } = api.project.getCommits.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );
  const getChangeCount = (commit: Commit) => {
    return commit.summary
      .split("\n")
      .filter((line) => line.trim().startsWith("*")).length;
  };
  return (
    <ul className="space-y-6">
      {!commits ? (
        Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="relative flex gap-x-4">
            <div className="absolute -bottom-6 left-0 top-0 flex w-6 justify-center">
              <div className="w-px translate-x-1 bg-black dark:bg-neutral-500" />
            </div>
            <Skeleton className="relative mt-4 size-8 flex-none rounded-full" />
            <div className="flex-auto rounded-md bg-neutral-300 p-3 shadow ring-1 ring-inset ring-white dark:bg-foundation-blue-900 dark:shadow-none dark:ring-black">
              <div className="flex w-full items-center justify-between">
                <div className="flex gap-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-5/6" />
            </div>
          </li>
        ))
      ) : (
        <FilteredList
          items={commits}
          getTitle={(c) => c.commitMessage}
          getAuthor={(c) => c.commitAuthorName}
          getDate={(c) => new Date(c.commitDate)}
          getChangeCount={getChangeCount}
          showChangeSort
          emptyState={
            <NotFoundImage text="No commits matched your search or filters." />
          }
          renderItem={(commit) => (
            <li key={commit.id} className="relative flex gap-x-4">
              <div
                className={cn(
                  commits[commits.length - 1]!.id === commit.id
                    ? "h-6"
                    : "-bottom-6",
                  "absolute left-0 top-0 flex w-6 justify-center",
                )}
              >
                <div className="w-px translate-x-1 bg-black dark:bg-neutral-500" />
              </div>
              <Image
                src={commit.commitAuthorAvatar}
                alt={commit.commitAuthorName}
                width={24}
                height={24}
                className="relative mt-4 size-8 flex-none rounded-full bg-gray-50"
              />
              <div className="flex-auto rounded-md bg-sidebar p-3 shadow ring-1 ring-inset ring-white dark:bg-foundation-blue-900 dark:ring-black">
                <div className="flex w-full items-center justify-between">
                  <div className="flex gap-x-4">
                    <Link
                      target="_blank"
                      href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                      className="py-0.5 text-xs leading-5 text-gray-500"
                    >
                      <span className="font-medium text-black dark:text-gray-200">
                        {commit.commitAuthorName}
                      </span>
                      <span className="ml-2 inline-flex items-center text-gray-500 underline">
                        committed
                        <ExternalLink className="ml-1 size-4" />
                      </span>
                    </Link>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(commit.commitDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                </div>
                <span className="font-semibold">{commit.commitMessage}</span>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-400">
                  {commit.summary}
                </pre>
              </div>
            </li>
          )}
        />
      )}
    </ul>
  );
};

export default CommitLogs;
