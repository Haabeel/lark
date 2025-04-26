import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { pollCommits } from "@/lib/github";
import { createBackgroundHue } from "@/lib/utils";
import { indexGithubRepo } from "@/lib/repository";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const normalizedGithubUrl = input.githubUrl.endsWith("/")
          ? input.githubUrl.slice(0, -1)
          : input.githubUrl;
        const backgroundColor = createBackgroundHue();
        const project = await ctx.db.project.create({
          data: {
            githubUrl: normalizedGithubUrl,
            name: input.name,
            description: input.description,
            creatorId: ctx.user.user.id,
            backgroundColor,
            members: {
              create: {
                userId: ctx.user.user.id,
                role: "MAINTAINER",
              },
            },
          },
        });
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
        await pollCommits(project.id);
        return project;
      } catch (error) {
        console.log(error);
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        members: {
          some: {
            userId: ctx.user.user.id,
          },
        },
        deletedAt: null,
      },
      include: {
        members: true
      }
    });
  }),
  getCommits: protectedProcedure.input(z.object({
    projectId: z.string()
  })).query(async ({ ctx, input }) => {
    pollCommits(input.projectId).then().catch(console.error)
    return await ctx.db.commit.findMany({ where: { projectId: input.projectId } })
  }),
  saveAnswer: protectedProcedure.input(z.object({
    projectId: z.string(),
    question: z.string(),
    answer: z.string(),
    filesReferences: z.any()
  })).mutation(async ({ ctx, input }) => {
    return await ctx.db.question.create({
      data: {
        answer: input.answer,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        filesReference: input.filesReferences,
        question: input.question,
        projectId: input.projectId,
        userId: ctx.user.user.id,
      }
    })
  }),
  getQuestions: protectedProcedure.input(z.object({
    projectId: z.string()
  })).query(async ({ ctx, input }) => {
    return await ctx.db.question.findMany({
      where: {
        projectId: input.projectId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }),
  archiveProject: protectedProcedure.input(z.object({
    projectId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    return await ctx.db.project.update({
      where: { id: input.projectId },
      data: { deletedAt: new Date() },
    });
  }),
  getTeamMembers: protectedProcedure.input(z.object({
    projectId: z.string(),
  })).query(async ({ ctx, input }) => {
    return await ctx.db.member.findMany({
      where: { projectId: input.projectId },
      include: { user: true },
    });
  }),
});
