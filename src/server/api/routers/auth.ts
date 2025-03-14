import { auth } from "@/lib/auth";
import { createTRPCRouter, publicProcedure, secureProcedure } from "../trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    return await auth.api.getSession({
      headers: ctx.headers,
    });
  }),
  sendVerificationEmail: secureProcedure
    .input(
      z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      }),
    )
    .mutation(async ({ input }) => {
      const { transporter } = await import("@/lib/node-mailer");
      try {
        await transporter.sendMail({
          from: `Lark <${process.env.GMAIL_USER}>`,
          to: input.email,
          subject: "Your Verification Code",
          html: `<p>Your OTP is: <strong>${input.otp}</strong></p>`,
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to send email", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),
});

export type AuthRouter = typeof authRouter;
