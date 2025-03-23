import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { pollCommits } from "@/lib/github";

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
        const project = await ctx.db.project.create({
          data: {
            githubUrl: normalizedGithubUrl,
            name: input.name,
            description: input.description,
            creatorId: ctx.user.user.id,
            members: {
              create: {
                userId: ctx.user.user.id,
                role: "MAINTAINER",
              },
            },
          },
        });
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
});
