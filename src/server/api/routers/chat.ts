// src/server/api/routers/chat.ts
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { AttachmentType, Prisma } from "@prisma/client";

export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string().min(1, "Channel ID is required."),
        memberId: z.string().optional(),
        content: z.string(), // Content is always a string (can be empty if attachments exist)
        attachments: z
          .array(
            z.object({
              url: z.string().url("Invalid attachment URL."),
              type: z.nativeEnum(AttachmentType),
              fileName: z.string().optional(),
              fileSize: z.number().int().optional(),
            }),
          )
          .optional(), // The array of attachments is optional
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.user.id; // This is the senderId from your session

      // Destructure all inputs for clarity
      const { channelId, memberId, content, attachments } = input;

      // Validation: Must have non-empty content OR at least one attachment
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Message content cannot be empty if no attachments are provided.",
        });
      }

      // Additional Authorization (Highly Recommended):
      // 1. Verify that `currentUserId` (from session) matches the user associated with `memberId`.
      // 2. Verify that the `memberId` is actually a member of the `channelId`.
      // These checks prevent a user from sending messages as another member or to channels they aren't part of.

      // Example (conceptual - you'll need to implement based on your schema):
      // const memberRecord = await ctx.db.channelMember.findUnique({
      //   where: { id: memberId },
      //   select: { userId: true, channelId: true } // Assuming Member links to User and Project
      // });
      //
      // if (!memberRecord || memberRecord.userId !== currentUserId) {
      //   throw new TRPCError({
      //     code: "FORBIDDEN",
      //     message: "You are not authorized to send messages as this member.",
      //   });
      // }

      // You might also want to check if this member (via memberRecord.projectId)
      // is allowed to post in this specific channelId.
      // This depends on how your channels are linked to projects or users.
      // For DMs, memberId might be null if senderId directly links to user,
      // so the logic for `memberId` in DMs needs care.

      // If this sendMessage is also for DMs where memberId might not be relevant
      // because senderId is the direct link, you'd need to adjust.
      // The current schema change makes memberId always required.

      try {
        const newMessage = await ctx.db.message.create({
          data: {
            senderId: currentUserId, // The actual user sending the message
            channelId: channelId,
            memberId: memberId, // <<--- memberId IS NOW ALWAYS PROVIDED
            content: content, // Will be "" if user sent only attachment(s) but typed nothing
            attachments:
              attachments && attachments.length > 0
                ? {
                    create: attachments.map((att) => ({
                      url: att.url,
                      type: att.type,
                      fileName: att.fileName,
                      fileSize: att.fileSize,
                      // messageId will be automatically set by Prisma
                    })),
                  }
                : undefined, // Prisma handles undefined for optional relations gracefully
          },
          include: {
            // Include relations needed for the client-side and Realtime payload
            sender: { select: { id: true, name: true, image: true } },
            attachments: true,
            // member: true, // Optionally include member details if needed by client immediately
          },
        });

        // Realtime event will be triggered by Supabase based on DB change for 'message' and 'attachment' tables.

        return newMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        // Add more specific error handling if needed (e.g., Prisma errors)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message.",
        });
      }
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        offset: z.number().default(0),
        limit: z.number().min(1).max(100).default(3),
      }),
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db.message.findMany({
        where: { channelId: input.channelId },
        include: { sender: true, attachments: true },
        orderBy: { createdAt: "desc" },
        // skip: input.offset,
        // take: input.limit,
      });

      const totalCount = await ctx.db.message.count({
        where: { channelId: input.channelId },
      });
      const hasMore = input.offset + input.limit < totalCount;
      console.log(
        "MESSAGES\n",
        "-----------------",
        messages,
        "\n--------------------",
      );
      return {
        messages,
        hasMore,
        nextOffset: input.offset + input.limit,
      };
    }),
  getMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.message.findUnique({
          where: { id: input.messageId },
          include: { sender: true, attachments: true },
        });
      } catch (error) {
        console.error("Error fetching message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch message",
        });
      }
    }),
  /**
   * Updates the content of an existing message.
   * Only the sender of the message can update it.
   */
  updateMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().min(1, "Message ID cannot be empty."),
        content: z.string().min(1, "Message content cannot be empty."),
        // Optional: You might want to add channelId if you need it for invalidation context
        // channelId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.user.id; // Assumes ctx.user.user.id is the logged-in User's ID

      // 1. Find the message to be updated
      const messageToUpdate = await ctx.db.message.findUnique({
        where: {
          id: input.messageId,
        },
      });

      if (!messageToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found.",
        });
      }

      // 2. Check if the current user is the sender of the message
      if (messageToUpdate.senderId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update this message.",
        });
      }

      // 3. Update the message
      try {
        const updatedMessage = await ctx.db.message.update({
          where: {
            id: input.messageId,
            // You could add senderId here again as an extra check, though already verified
            // senderId: currentUserId,
          },
          data: {
            content: input.content,
            // You might want to add an `updatedAt` field to your Message model
            // and set it here: updatedAt: new Date(),
          },
          // Include sender and attachments if your client-side expects the full enriched message object after update
          // include: {
          //   sender: true,
          //   attachments: true,
          // }
        });
        return updatedMessage;
      } catch (error) {
        console.error("Error updating message:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Handle known Prisma errors, e.g., if the record to update is not found (though checked above)
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Message to update was not found.",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update message.",
        });
      }
    }),
  /**
   * Deletes an existing message.
   * Only the sender of the message can delete it.
   * (Alternatively, channel/project admins might also have delete permissions - adjust logic if needed)
   */
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().min(1, "Message ID cannot be empty."),
        // Optional: You might want to add channelId if you need it for invalidation or context
        // channelId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.user.id;

      // 1. Find the message to be deleted
      const messageToDelete = await ctx.db.message.findUnique({
        where: {
          id: input.messageId,
        },
      });

      if (!messageToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found.",
        });
      }

      // 2. Check if the current user is the sender of the message
      //    (Add more complex role-based permissions if needed, e.g., admins can delete any message)
      if (messageToDelete.senderId !== currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this message.",
        });
      }

      // 3. Delete the message
      try {
        await ctx.db.message.delete({
          where: {
            id: input.messageId,
            // You could add senderId here again as an extra check
            // senderId: currentUserId,
          },
        });

        // For DELETE operations, it's common to return the ID of the deleted item
        // or a success status, as the full object no longer exists.
        // The Realtime event will carry the `old` data.
        return {
          id: input.messageId, // Return the ID of the deleted message
          success: true,
          // channelId: messageToDelete.channelId // Return channelId if needed for client-side processing
        };
      } catch (error) {
        console.error("Error deleting message:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            // Record to delete not found
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Message to delete was not found.",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete message.",
        });
      }
    }),
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Channel name cannot be empty."), // Added min length validation
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const creatorUserId = ctx.user.user.id; // Assuming ctx.user.user.id is the User ID

      try {
        // Use a transaction to ensure atomicity
        const result = await ctx.db.$transaction(async (prisma) => {
          // 1. Find the Member record for the creator in the specified project
          const projectMember = await prisma.member.findUnique({
            where: {
              userId_projectId: {
                // Using the @@unique([userId, projectId]) constraint
                userId: creatorUserId,
                projectId: input.projectId,
              },
            },
          });

          if (!projectMember) {
            // This case should ideally not happen if the user creating a channel
            // within a project is already validated to be part of that project.
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Creator is not a member of this project and cannot create channels.",
            });
          }

          // 2. Create the channel
          const newChannel = await prisma.channel.create({
            data: {
              name: input.name,
              isDm: false, // Explicitly false for project channels
              projectId: input.projectId,
              creatorId: creatorUserId, // The User ID of the creator
            },
            // You can include related data if needed for the return,
            // but members list here won't include the one we are about to create
            // unless we re-fetch or structure the return differently.
            // For simplicity, we'll return the channel object from this step.
          });

          // 3. Add the creator as the first member of the newly created channel
          await prisma.channelMember.create({
            data: {
              channelId: newChannel.id,
              memberId: projectMember.id, // Link to the Member record
              // userId on ChannelMember would be null here as it's a project member
            },
          });

          // The transaction will return the result of the last operation if not specified,
          // or you can explicitly return what you need. Let's return the newChannel.
          return newChannel;
        });

        // The 'result' here is the 'newChannel' returned from the transaction
        // If you need to return the channel with its members (including the newly added creator),
        // you might consider fetching it again here, though often client-side invalidation handles this.
        // For now, returning the created channel object is fine.
        return result;
      } catch (error) {
        console.error("Error creating channel and adding member:", error);
        if (error instanceof TRPCError) {
          throw error; // Re-throw TRPCError instances
        }
        // For other errors, wrap them in a TRPCError
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create channel. Please try again.",
          cause: error, // Optionally include the original error as a cause
        });
      }
    }),
  getChannels: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.channel.findMany({
          where: { projectId: input.projectId },
          include: {
            members: {
              where: { userId: ctx.user.user.id },
            },
          },
        });
      } catch (error) {
        console.error("Error fetching channels:", error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch channels",
        });
      }
    }),
  getChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.channel.findUnique({
          where: { id: input.channelId },
          include: {
            members: {
              where: { userId: ctx.user.user.id },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: true },
            },
          },
        });
      } catch (error) {
        console.error("Error fetching channel:", error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch channel",
        });
      }
    }),
  updateChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        name: z.string().optional(),
        membersToAdd: z.array(z.string()).optional(),
        membersToRemove: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { channelId, name, membersToAdd, membersToRemove } = input;

        if (name) {
          await ctx.db.channel.update({
            where: { id: channelId },
            data: { name },
          });
        }
        // Remove members
        if (membersToRemove && membersToRemove.length > 0) {
          await ctx.db.channelMember.deleteMany({
            where: {
              channelId,
              memberId: { in: membersToRemove },
            },
          });
        }
        //add members
        if (membersToAdd && membersToAdd.length > 0) {
          await ctx.db.channelMember.createMany({
            data: membersToAdd.map((memberId) => ({
              channelId,
              memberId,
            })),
            skipDuplicates: true,
          });
        }
      } catch (error) {
        console.error("Error updating channel:", error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update channel",
        });
      }
    }),
  deleteChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.channel.delete({
          where: { id: input.channelId },
        });
      } catch (error) {
        console.error("Error deleting channel:", error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete channel",
        });
      }
    }),
  getAllUserChannelIds: protectedProcedure // Renamed for clarity
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Find all ChannelMember entries where the associated Member record's userId matches the input userId.
      // This targets channels where the user is a member due to their project role.
      const projectChannelMemberships = await ctx.db.channelMember.findMany({
        where: {
          // The ChannelMember must be linked to a Project Member record
          member: {
            // And that Project Member record's userId must be the input userId
            userId: input.userId,
          },
          // AND the channel itself must be associated with a project
          // (to explicitly exclude DMs if they could sneak in via ChannelMember.memberId somehow, though unlikely with good data hygiene)
          channel: {
            projectId: {
              not: null, // Ensures it's a project channel
            },
          },
        },
        include: {
          channel: true,
        },
        // select: {
        //   channelId: true, // We only need the channelId
        // },
      });

      // Extract the channel IDs and ensure uniqueness
      const uniqueChannelIds = [...new Set(projectChannelMemberships)];
      console.log(
        "-----------UNIQUE CHANNELS-----------------",
        uniqueChannelIds,
      );
      return uniqueChannelIds;
    }),
  createDmChannel: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userAId = ctx.user.user.id;
        const userBId = input.userId;
        const [user1, user2] = [userAId, userBId].sort();

        if (!user1 || !user2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User IDs are required",
          });
        }

        const existingChannel = await ctx.db.channel.findFirst({
          where: {
            isDm: true,
            members: {
              every: {
                userId: {
                  in: [user1, user2],
                },
              },
            },
          },
          include: {
            members: true,
          },
        });
        if (existingChannel && existingChannel.members.length === 2) {
          return existingChannel;
        }
        const newChannel = await ctx.db.channel.create({
          data: {
            isDm: true,
            creatorId: user1,
            members: {
              create: [{ userId: user1 }, { userId: user2 }],
            },
          },
          include: {
            members: true,
          },
        });
        return newChannel;
      } catch (error) {
        console.error("Error creating DM channel:", error);
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create DM channel",
        });
      }
    }),
  getDmChannels: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return ctx.db.channel.findMany({
          where: {
            isDm: true,
            members: {
              some: {
                userId: input.userId,
              },
            },
          },
          select: {
            id: true,
          },
        });
      } catch (error) {
        console.error("Error fetching DM channels:", error);
      }
    }),
  getOrCreateDmChannel: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1, "Target user ID cannot be empty."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.user.id; // Assuming ctx.user.user.id is the logged-in User's ID
      const { targetUserId } = input;

      if (currentUserId === targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot create a direct message with yourself.",
        });
      }

      // Step 1: Try to find an existing DM channel.
      // A DM channel must:
      // 1. Have `isDm: true`
      // 2. Have `projectId: null` (for global DMs)
      // 3. Include the current user as a member (via ChannelMember.userId)
      // 4. Include the target user as a member (via ChannelMember.userId)
      // 5. Have *exactly* two members in total.

      const existingChannels = await ctx.db.channel.findMany({
        where: {
          isDm: true,
          projectId: null, // Ensure it's a global DM
          AND: [
            // Both users must be members of the channel
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: targetUserId } } },
          ],
        },
        include: {
          members: {
            select: {
              userId: true, // Select only userId for counting and verification
            },
          },
        },
      });

      // Filter the results to find a channel that ONLY has these two members
      const existingDm = existingChannels.find(
        (channel) =>
          channel.members.length === 2 && // Must have exactly two members
          channel.members.every(
            (
              member, // And those members must be currentUserId or targetUserId
            ) =>
              member.userId === currentUserId || member.userId === targetUserId,
          ),
      );

      if (existingDm) {
        // If an existing DM is found, return its ID
        return {
          channelId: existingDm.id,
          isNew: false, // Indicate that this channel was pre-existing
        };
      }

      // Step 2: If no existing DM is found, create a new one.
      // Your Channel schema requires a `creatorId`. For DMs, this could be the user initiating.
      if (!ctx.user.user.id) {
        // Should be caught by protectedProcedure, but good practice
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated to create channel.",
        });
      }

      try {
        const newDmChannel = await ctx.db.channel.create({
          data: {
            name: null, // DM channels typically don't have a user-set name; it's derived from participants
            isDm: true,
            projectId: null, // Explicitly null for DMs
            creatorId: currentUserId, // Fulfilling schema requirement
            // Create ChannelMember entries for both participants
            members: {
              create: [
                {
                  userId: currentUserId, // Current user
                  // memberId would be null as this is not tied to a project membership
                },
                {
                  userId: targetUserId, // Target user
                  // memberId would be null
                },
              ],
            },
          },
          select: {
            // Select only the ID for the return value, or more if needed client-side
            id: true,
          },
        });

        return {
          channelId: newDmChannel.id,
          isNew: true, // Indicate that this channel was newly created
        };
      } catch (error) {
        console.error("Error creating DM channel:", error);
        // Check for specific Prisma errors if needed, e.g., unique constraint violations
        // (though the logic above tries to prevent duplicates)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create direct message channel.",
          cause: error,
        });
      }
    }),

  getUserDms: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.user.user.id;

    try {
      const dmChannels = await ctx.db.channel.findMany({
        where: {
          isDm: true,
          projectId: null, // Global DMs
          members: {
            some: {
              userId: currentUserId, // Current user is a member
            },
          },
        },
        include: {
          members: {
            // Include members to identify the other user and count
            include: {
              user: {
                // Include the User record for name/image
                select: { id: true, name: true, image: true },
              },
            },
          },
          // Optionally include last message for display in sidebar
          // messages: {
          //   orderBy: { createdAt: 'desc' },
          //   take: 1,
          // },
        },
      });

      // Filter for DMs that are strictly 1:1 with the current user
      return dmChannels
        .filter((channel) => channel.members.length === 2) // Ensure it's a 1:1 DM
        .map((channel) => {
          const otherMember = channel.members.find(
            (m) => m.user?.id !== currentUserId,
          )?.user;
          return {
            ...channel,
            id: channel.id,
            // For DMs, name is usually the other person's name
            name: otherMember?.name ?? "Direct Message",
            otherUserId: otherMember?.id,
            otherUserImage: otherMember?.image,
            // lastMessage: channel.messages[0]?.content,
            // lastMessageAt: channel.messages[0]?.createdAt,
          };
        });
    } catch (error) {
      console.error("Error fetching DM channels:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch DM channels",
      });
    }
  }),
  getChannelMembers: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.db.channelMember.findMany({
          where: {
            channelId: input.channelId,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
            user: true,
          },
        });
      } catch (error) {
        console.error("Error fetching channel members:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch channel members",
        });
      }
    }),
});
