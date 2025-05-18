import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

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
  getCurrentUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.user.id; // Assuming your session context provides this
    const userProfile = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        image: true,
        // emailVerified: true, // If you want to display this
      },
    });

    if (!userProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found.",
      });
    }
    return userProfile;
  }),

  // Procedure to update the current authenticated user's profile
  updateCurrentUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Display name cannot be empty.").optional(),
        firstName: z.string().min(1, "First name cannot be empty.").optional(),
        lastName: z.string().optional(), // Keep as optional
        image: z.string().url("Invalid image URL.").optional().nullable(), // For updating image URL
        // Email updates usually require a verification process, so often handled separately.
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.user.id;

      // Construct data object only with fields that are actually provided in the input
      const dataToUpdate: {
        name?: string;
        firstName?: string;
        lastName?: string | null; // Prisma needs null for optional string reset
        image?: string | null;
      } = {};

      if (input.name !== undefined) dataToUpdate.name = input.name;
      if (input.firstName !== undefined)
        dataToUpdate.firstName = input.firstName;
      if (input.lastName !== undefined)
        dataToUpdate.lastName = input.lastName === "" ? null : input.lastName; // Set to null if empty string
      if (input.image !== undefined) dataToUpdate.image = input.image;

      if (Object.keys(dataToUpdate).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields provided for update.",
        });
      }

      try {
        const updatedUser = await ctx.db.user.update({
          where: { id: userId },
          data: {
            ...dataToUpdate,
            updatedAt: new Date(), // Explicitly update updatedAt
          },
          select: {
            // Return the updated profile
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        });
        return updatedUser;
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile.",
        });
      }
    }),
});
