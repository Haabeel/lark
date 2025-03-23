import { createAuthClient } from "better-auth/client";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { type auth } from "./auth";

export const {
  signUp,
  signOut,
  signIn,
  getSession,
  useSession,
  emailOtp,
  sendVerificationEmail,
} = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [emailOTPClient(), inferAdditionalFields<typeof auth>()],
});
