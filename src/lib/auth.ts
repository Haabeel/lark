import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ url, newEmail }) => {
        const { api } = await import("@/trpc/server");
        console.log("Sending email verification for change email");
        await api.auth
          .sendFogetPasswordEmail({ email: newEmail, url })
          .catch((error) => console.log(error));
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const { api } = await import("@/trpc/server");
      await api.auth
        .sendFogetPasswordEmail({ email: user.email, url })
        .catch((error) => console.log(error));
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ")[1],
        };
      },
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      requireSelectAccount: true,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.name.split(" ")[0],
          lastName: profile.name.split(" ")[1],
        };
      },
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

export type Session = typeof auth.$Infer.Session;
