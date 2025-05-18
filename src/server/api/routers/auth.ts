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
  sendChangeEmail: secureProcedure
    .input(
      z.object({
        email: z.string().email(),
        url: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { transporter } = await import("@/lib/node-mailer");
      try {
        await transporter.sendMail({
          from: `Lark <${process.env.GMAIL_USER}>`,
          to: input.email,
          subject: "Change Email Verification",
          html: `<p>Click <a href="${input.url}">here</a> to verify your new email address.</p>`,
        });
        return { success: true };
      } catch {
        console.error("Failed to send email");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),
  sendFogetPasswordEmail: secureProcedure
    .input(
      z.object({
        email: z.string().email(),
        url: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { transporter } = await import("@/lib/node-mailer");
      try {
        await transporter.sendMail({
          from: `Lark <${process.env.GMAIL_USER}>`,
          to: input.email,
          subject: "Reset Password",
          html: `<p>Click <a href="${input.url}">here</a> to reset your password.</p>`,
        });
        return { success: true };
      } catch {
        console.error("Failed to send email");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
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
