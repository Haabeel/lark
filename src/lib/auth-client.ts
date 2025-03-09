import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const { signUp, signOut, signIn, getSession, useSession, emailOtp, sendVerificationEmail } =
  createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [emailOTPClient()],
  });
