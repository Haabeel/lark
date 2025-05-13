import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: { id: ctx.user.user.id },
      include: {
        accounts: true,
        memberships: true,
        projects: true,
        questionsAsked: true,
        sessions: true,
      },
    });
  }),
});
