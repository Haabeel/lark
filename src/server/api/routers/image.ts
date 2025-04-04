import { db } from "@/server/db";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import axios from "axios";
import { backendClient } from "@/lib/edgestore";

export const imageRouter = createTRPCRouter({
  migrateImage: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        provider: z.string(),
        externalUrl: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, provider, externalUrl } = input;
      try {
        const res = await backendClient.profile.upload({
          input: {
            provider: provider,
            user: userId,
          },
          content: {
            url: externalUrl,
            extension: "jpg",
          },
        });
        await db.user.update({
          where: { id: userId },
          data: {
            image: res.url,
          },
        });
      } catch (error) {
        console.error("Error fetching image from external URL");
        console.error(error);
      }
    }),
});
