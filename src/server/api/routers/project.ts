import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { pollCommits } from "@/lib/github";
import { createBackgroundHue } from "@/lib/utils";
import { indexGithubRepo } from "@/lib/repository";
import { TaskStatus, TaskPriority } from "@prisma/client";

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
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken);
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
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
      });
    }),
  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          filesReference: input.filesReferences,
          question: input.question,
          projectId: input.projectId,
          userId: ctx.user.user.id,
        },
      });
    }),
  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
  deleteQuestion: protectedProcedure
    .input(
      z.object({
        questionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.user.id },
        include: {
          memberships: true,
          questionsAsked: true,
        },
      });
      if (!user)
        return new TRPCError({
          code: "FORBIDDEN",
          message: "You can't delete this question",
        });
      const question = user.questionsAsked.find(
        (question) => question.id === input.questionId,
      );
      if (question?.userId === user.id)
        return await ctx.db.question.delete({
          where: { id: input.questionId },
        });

      const fullQuestion = await ctx.db.question.findUnique({
        where: { id: input.questionId },
      });
      if (!fullQuestion)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });

      const isMaintainer = user.memberships.some(
        (member) =>
          member.projectId === fullQuestion.projectId &&
          member.role === "MAINTAINER",
      );

      if (!isMaintainer)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't delete this question",
        });

      return await ctx.db.question.delete({
        where: { id: input.questionId },
      });
    }),
  archiveProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: { id: input.projectId },
        data: { deletedAt: new Date() },
      });
    }),
  getTeamMembers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findMany({
        where: { projectId: input.projectId },
        include: { user: true },
      });
    }),
  getTasks: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.task.findMany({
          where: {
            projectId: input.projectId,
          },
          include: {
            assignee: {
              include: {
                user: true,
              },
            },
          },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get tasks",
        });
      }
    }),
  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus),
        priority: z.nativeEnum(TaskPriority),
        startDate: z.date(),
        endDate: z.date(),
        assigneeId: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const maxOrderTask = await ctx.db.task.aggregate({
          _max: {
            order: true,
          },
          where: {
            projectId: input.projectId,
            status: input.status,
          },
        });
        const nextOrder = (maxOrderTask._max.order ?? 0) + 1;

        return await ctx.db.task.create({
          data: {
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            startDate: input.startDate,
            endDate: input.endDate,
            createdById: input.memberId,
            order: nextOrder,
            assigneeId: input.assigneeId,
          },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create task",
        });
      }
    }),
  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.task.delete({
          where: { id: input.taskId },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }
    }),
  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        assigneeId: z.string().optional(),
        order: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.task.update({
          where: { id: input.taskId },
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            startDate: input.startDate,
            endDate: input.endDate,
            assigneeId: input.assigneeId,
            order: input.order,
          },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }
    }),
  reorderTask: protectedProcedure
    .input(
      z.object({
        updates: z
          .array(
            z.object({
              id: z.string(),
              status: z.nativeEnum(TaskStatus),
              order: z.number().int().positive(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.user.id;

      try {
        // Get all tasks being updated
        const tasks = await ctx.db.task.findMany({
          where: {
            id: { in: input.updates.map((t) => t.id) },
          },
          select: {
            id: true,
            projectId: true,
          },
        });

        if (tasks.length !== input.updates.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some tasks were not found.",
          });
        }

        // Get distinct projectIds from the tasks
        const projectIds = [...new Set(tasks.map((t) => t.projectId))];

        // All tasks should belong to the same project (optional constraint)
        if (projectIds.length > 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tasks must belong to the same project.",
          });
        }

        const projectId = projectIds[0];

        // Check if the current user is a member of the project
        const membership = await ctx.db.member.findFirst({
          where: {
            userId,
            projectId,
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this project.",
          });
        }

        if (membership.role !== "MAINTAINER") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only maintainers can reorder tasks.",
          });
        }

        // Perform the updates in a transaction
        await ctx.db.$transaction(
          input.updates.map((update) =>
            ctx.db.task.update({
              where: { id: update.id },
              data: {
                status: update.status,
                order: update.order,
              },
            }),
          ),
        );

        return { success: true };
      } catch (error) {
        console.error("Failed to reorder tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder tasks",
        });
      }
    }),
  createColumn: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1, "Column name cannot be empty"),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.kanbanColumn.findFirst({
        where: {
          projectId: input.projectId,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A column with that name already exists in this project.",
        });
      }

      return await ctx.db.kanbanColumn.create({
        data: {
          name: input.name,
          projectId: input.projectId,
          order: input.order,
        },
      });
    }),
  updateColumn: protectedProcedure
    .input(
      z.object({
        columnId: z.string(),
        projectId: z.string(),
        name: z.string().min(1, "Column name cannot be empty"),
        newName: z.string().optional(),
        order: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.kanbanColumn.findFirst({
        where: {
          projectId: input.projectId,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A column with that name already exists in this project.",
        });
      }

      return await ctx.db.kanbanColumn.update({
        where: {
          id: input.columnId,
        },
        data: {
          order: input.order,
          name: input.newName,
        },
      });
    }),
  deleteColumn: protectedProcedure
    .input(
      z.object({
        columnId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.kanbanColumn.delete({
        where: { id: input.columnId },
      });
    }),
});
