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
      const { db, user } = ctx;
      const { name, description, githubUrl, githubToken } = input;

      const normalizedGithubUrl = githubUrl.endsWith("/")
        ? githubUrl.slice(0, -1)
        : githubUrl;

      const project = await db.project.create({
        data: {
          name,
          description,
          githubUrl: normalizedGithubUrl,
          backgroundColor: createBackgroundHue(),
          creatorId: user.user.id,
          members: {
            create: {
              userId: user.user.id,
              role: "MAINTAINER",
            },
          },
        },
      });

      // 🔥 Fire and forget the expensive work
      void (async () => {
        const createProgressCallback = async (
          step: string,
          progress: number,
        ) => {
          try {
            await db.progress.create({
              data: {
                projectId: project.id,
                step,
                progress: progress * 100,
              },
            });
          } catch (err) {
            console.error("Failed to save progress:", err);
          }
        };

        const reportProgress = (step: string, progress: number) => {
          void createProgressCallback(step, progress);
        };

        try {
          await indexGithubRepo(
            project.id,
            githubUrl,
            githubToken,
            reportProgress,
          );
          await pollCommits(project.id, reportProgress);
        } catch (err) {
          console.error("Background indexing/polling failed", err);
        }
      })();

      // ✅ Return the project immediately
      return project;
    }),
  insertProgress: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        step: z.string(),
        progress: z.number().min(0).max(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { projectId, step, progress } = input;

      await ctx.db.progress.create({
        data: {
          projectId,
          step,
          progress,
        },
      });
      return { success: true };
    }),
  getProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.project.findUnique({
          where: { id: input.projectId },
        });
      } catch (error) {
        console.error(error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project",
        });
      }
    }),
  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        githubUrl: z.string().optional(),
        backgroundColor: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { projectId, name, description, githubUrl, backgroundColor } =
          input;

        const existing = await ctx.db.project.findUnique({
          where: { id: projectId },
          select: { githubUrl: true },
        });
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        const data: {
          name?: string;
          description?: string;
          githubUrl?: string;
          backgroundColor?: string;
        } = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (backgroundColor !== undefined)
          data.backgroundColor = backgroundColor;

        // 3) If GitHub URL changed, wipe old data & re-index
        const normalized = githubUrl
          ? githubUrl.endsWith("/")
            ? githubUrl.slice(0, -1)
            : githubUrl
          : undefined;

        const doReindex = normalized && normalized !== existing.githubUrl;
        if (doReindex) {
          // transaction: delete old relations, update URL, then outside reindex
          await ctx.db.$transaction([
            ctx.db.commit.deleteMany({ where: { projectId } }),
            ctx.db.question.deleteMany({ where: { projectId } }),
            ctx.db.sourceCodeEmbedding.deleteMany({ where: { projectId } }),
            // you might also clear KanbanColumns or Tasks if desired
            ctx.db.project.update({
              where: { id: projectId },
              data: { githubUrl: normalized, ...data },
            }),
          ]);

          // kick off background indexing & polling
          await indexGithubRepo(projectId, normalized, /* token? */ undefined);
          pollCommits(projectId).catch(console.error);
        } else {
          // just update non-github fields or same URL
          if (normalized) data.githubUrl = normalized;
          await ctx.db.project.update({
            where: { id: projectId },
            data,
          });
        }

        return await ctx.db.project.findUnique({ where: { id: projectId } });
      } catch (error) {
        console.error(error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project",
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
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["MAINTAINER", "CONTRIBUTOR"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.member.update({
          where: { id: input.memberId },
          data: {
            role: input.role,
          },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member role",
        });
      }
    }),
  removeMember: protectedProcedure
    .input(z.object({ projectId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.member.delete({
          where: { id: input.memberId },
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove member",
        });
      }
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
  getOverview: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const projectId = input.projectId;
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );

        // Base counts and groupings scoped to project
        const [
          totalTasks,
          tasksByStatus,
          tasksByPriority,
          totalCommits,
          totalQuestions,
          tasksThisMonth,
          tasksLastMonth,
          commitsThisMonth,
          commitsLastMonth,
          completedTasks,
          overdueTasks,
        ] = await Promise.all([
          ctx.db.task.count({ where: { projectId } }),
          ctx.db.task.groupBy({
            by: ["status"],
            where: { projectId },
            _count: { status: true },
          }),
          ctx.db.task.groupBy({
            by: ["priority"],
            where: { projectId },
            _count: { priority: true },
          }),
          ctx.db.commit.count({ where: { projectId } }),
          ctx.db.question.count({ where: { projectId } }),
          ctx.db.task.count({
            where: { projectId, createdAt: { gte: startOfThisMonth } },
          }),
          ctx.db.task.count({
            where: {
              projectId,
              createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
            },
          }),
          ctx.db.commit.count({
            where: { projectId, commitDate: { gte: startOfThisMonth } },
          }),
          ctx.db.commit.count({
            where: {
              projectId,
              commitDate: { gte: startOfLastMonth, lt: startOfThisMonth },
            },
          }),
          ctx.db.task.count({ where: { projectId, status: "DONE" } }),
          ctx.db.task.count({
            where: { projectId, endDate: { lt: now }, status: { not: "DONE" } },
          }),
        ]);

        // Member-specific analytics
        const members = await ctx.db.member.findMany({
          where: { projectId },
          include: { user: true },
        });

        // Overall commit frequency (all time)
        const firstCommit = await ctx.db.commit.findFirst({
          where: { projectId },
          select: { commitDate: true },
          orderBy: { commitDate: "asc" },
        });
        const since = firstCommit?.commitDate ?? new Date();
        const days =
          Math.ceil((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)) +
          1;

        const recentCommitsAll = await ctx.db.commit.findMany({
          where: { projectId },
          select: { commitDate: true },
        });

        const freqMapAll: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date(since);
          d.setDate(since.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          freqMapAll[key] = 0;
        }
        recentCommitsAll.forEach(({ commitDate }) => {
          const key = commitDate.toISOString().slice(0, 10);
          if (freqMapAll[key] !== undefined) freqMapAll[key]++;
        });
        const commitFrequency = Object.entries(freqMapAll).map(
          ([date, count]) => ({ date, count }),
        );

        // Commit contributions by author
        const commitContributionsRaw = await ctx.db.commit.groupBy({
          by: ["commitAuthorName", "commitAuthorAvatar"],
          where: { projectId },
          _count: { commitAuthorName: true },
        });
        const commitContributions = commitContributionsRaw.map((c) => ({
          author: c.commitAuthorName,
          avatar: c.commitAuthorAvatar,
          count: c._count.commitAuthorName,
        }));

        const memberStats = await Promise.all(
          members.map(async (member) => {
            const [assignedCount, completedCount, overdueCount] =
              await Promise.all([
                ctx.db.task.count({
                  where: { projectId, assigneeId: member.id },
                }),
                ctx.db.task.count({
                  where: { projectId, assigneeId: member.id, status: "DONE" },
                }),
                ctx.db.task.count({
                  where: {
                    projectId,
                    assigneeId: member.id,
                    endDate: { lt: now },
                    status: { not: "DONE" },
                  },
                }),
              ]);
            return {
              memberId: member.id,
              user: {
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                avatar: member.user.image,
              },
              assignedCount,
              completedCount,
              overdueCount,
            };
          }),
        );

        return {
          totalTasks,
          tasksByStatus: tasksByStatus.map((g) => ({
            status: g.status,
            count: g._count.status,
          })),
          tasksByPriority: tasksByPriority.map((g) => ({
            priority: g.priority,
            count: g._count.priority,
          })),
          totalCommits,
          totalQuestions,
          tasksThisMonth,
          tasksLastMonth,
          commitsThisMonth,
          commitsLastMonth,
          completedTasks,
          overdueTasks,
          commitFrequency,
          commitContributions,
          memberStats,
        };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics",
        });
      }
    }),
  getMyProjectMemberRecords: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user is populated by your auth middleware in protectedProcedure
    // Assuming ctx.user.user.id is the actual ID of the User model
    const currentUserId = ctx.user?.user?.id;

    if (!currentUserId) {
      // This should technically be caught by protectedProcedure if session/user is not resolved,
      // but an explicit check is good practice.
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated.",
      });
    }

    try {
      const memberRecords = await ctx.db.member.findMany({
        where: {
          userId: currentUserId,
        },
        select: {
          id: true, // Crucial: This is the Member.id needed for subscriptions
          projectId: true, // Useful for context, e.g., mapping memberId to a project
          role: true, // Might be useful for other client-side logic
          // user: { select: { id: true, name: true } }, // Optionally include basic user info
          // project: { select: { id: true, name: true } }, // Optionally include basic project info
        },
      });

      return memberRecords;
    } catch (error) {
      console.error("Failed to fetch user's project member records:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not retrieve your project memberships.",
      });
    }
  }),
  getMyTasksAcrossProjects: protectedProcedure
    .input(
      z
        .object({
          // Optional filters could be added here later
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      const currentUserId = ctx.user.user.id; // From your session

      const tasks = await ctx.db.task.findMany({
        where: {
          assignee: {
            // Tasks where the assignee (a Member) has the current user's ID
            userId: currentUserId,
          },
          // Example: Exclude DONE tasks by default, can be a filter later
          // status: {
          //   notIn: [TaskStatus.DONE],
          // }
        },
        include: {
          project: true,
          column:
            // This is your KanbanColumn, aliased as projectSection previously
            true,
          assignee: {
            include: {
              user: true,
            },
          },
          createdBy: {
            include: {
              user: true,
            },
          },
          // No 'tags' relation in your provided Task model
        },
        orderBy: [
          { endDate: "asc" }, // Due date (endDate)
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });

      // Group tasks by project
      const tasksByProject = tasks.reduce(
        (acc, task) => {
          const projectKey = task.projectId;
          if (!acc[projectKey]) {
            acc[projectKey] = {
              projectId: task.project.id,
              projectName: task.project.name,
              projectColor: task.project.backgroundColor,
              tasks: [],
            };
          }
          acc[projectKey].tasks.push(task);
          return acc;
        },
        {} as Record<
          string,
          {
            projectId: string;
            projectName: string;
            projectColor: string;
            tasks: Array<(typeof tasks)[0]>;
          }
        >,
      );

      return Object.values(tasksByProject).sort((a, b) =>
        a.projectName.localeCompare(b.projectName),
      );
    }),
});
