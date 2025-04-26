"use client";

import useProject from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const CommitLogs = () => {
  const { selectedProject: projectId, project } = useProject();
  const { data: commits } = api.project.getCommits.useQuery({ projectId });
  return (
    <ul className="space-y-6">
      {commits?.map((commit, commitId) => {
        return (
          <li key={commit.id} className="relative flex gap-x-4">
            <div
              className={cn(
                commitId === commits.length - 1 ? "h-6" : "-bottom-6",
                "absolute left-0 top-0 flex w-6 justify-center",
              )}
            >
              <div className="w-px translate-x-1 bg-neutral-500"></div>
            </div>
            <>
              <Image
                src={commit.commitAuthorAvatar}
                alt="avatar"
                width={24}
                height={24}
                className="relative mt-4 size-8 flex-none rounded-full bg-gray-50"
              />
              <div className="flex-auto rounded-md bg-foundation-blue-900 p-3 ring-1 ring-inset ring-black">
                <div className="flex w-full items-center justify-between">
                  <div className="flex justify-between gap-x-4">
                    <Link
                      target="_blank"
                      href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                      className="py-0.5 text-xs leading-5 text-gray-500"
                    >
                      <span className="font-medium text-gray-200">
                        {commit.commitAuthorName}
                      </span>
                      <span className="ml-2 inline-flex items-center text-gray-500 underline">
                        commited
                        <ExternalLink className="ml-1 size-4" />
                      </span>
                    </Link>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {commit.commitDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                </div>
                <span className="font-semibold">{commit.commitMessage}</span>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                  {commit.summary}
                </pre>
              </div>
            </>
          </li>
        );
      })}
    </ul>
  );
};

export default CommitLogs;
