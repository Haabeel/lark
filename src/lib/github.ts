/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { db } from "@/server/db";
import axios from "axios";
import { Octokit } from "octokit";
import { geminiSummarizeCommit } from "./gemini";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getCommitHashes = async (githubUrl: string) => {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  if (!owner || !repo) throw new Error("Invalid GitHub URL");
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const sortedCommits = data.sort((a: any, b: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return (new Date(b.commit.author?.date).getTime() -
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      new Date(a.commit.author?.date).getTime()) as any;
  });
  // TO DO: Remove the slice to make the function return all commits
  return sortedCommits.map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: (commit.commit.message as string) ?? "",
    commitAuthorName: (commit.commit.author?.name as string) ?? "",
    commitAuthorAvatar: (commit.author?.avatar_url as string) ?? "",
    commitDate: (commit.commit.author?.date as string) ?? "",
  }));
};

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await getProject(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommits = await findUnprocessedCommits(
    projectId,
    commitHashes,
  );
  const summaryResponses = await Promise.allSettled(
    unprocessedCommits.map((commit) => {
      return summarizeCommit(githubUrl, commit.commitHash);
    }),
  );
  const summaries = summaryResponses.map((response) => {
    if (response.status === "fulfilled") {
      return response.value;
    }
    return "";
  });
  const commits = await db.commit.createMany({
    data: summaries.map((summary, index) => {
      console.log(`processing commit ${index}`);
      return {
        projectId: projectId,
        commitHash: unprocessedCommits[index]?.commitHash ?? "",
        commitMessage: unprocessedCommits[index]?.commitMessage ?? "",
        commitAuthorName: unprocessedCommits[index]?.commitAuthorName ?? "",
        commitAuthorAvatar: unprocessedCommits[index]?.commitAuthorAvatar ?? "",
        commitDate: unprocessedCommits[index]?.commitDate ?? "",
        summary: summary ?? "",
      };
    }),
  });
  return commits;
};

async function getProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
    },
  });
  if (!project) throw new Error("Project not found");
  return { project, githubUrl: project.githubUrl };
}

async function findUnprocessedCommits(
  projectId: string,
  commitHashes: {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
  }[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
  });

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );
  return unprocessedCommits;
}

async function summarizeCommit(githubUrl: string, commitHash: string) {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`;
  console.log(`fetching commit diff from ${url}`);
  const data = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: `application/vnd.github.v3.diff`,
    },
  });
  if (!data) throw new Error("Failed to fetch commit diff");
  console.log("data: ", data);
  return await geminiSummarizeCommit(data.data as string);
}
