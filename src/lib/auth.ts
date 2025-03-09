import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      requireSelectAccount: true,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          console.log(`Sign up OTP for ${email}: ${otp}`);
        }
        if (type === "email-verification") {
          console.log(`Email verification OTP for ${email}: ${otp}`);
          const { api } = await import("@/trpc/server");
          await api.auth
            .sendVerificationEmail({ email, otp })
            .catch((error) => console.log(error));
        }
        if (type === "forget-password") {
          console.log(`Forget password OTP for ${email}: ${otp}`);
        }
      },
    }),
  ],
});
