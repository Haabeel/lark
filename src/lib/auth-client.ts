// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";
import {
  emailOTPClient, // This one is a known client plugin helper
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { type auth as ServerAuthType } from "./auth"; // Your server-side auth definition

const coreAuthClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL, // e.g., http://localhost:3000 or your production URL
  plugins: [
    emailOTPClient(), // For email OTP related flows
    inferAdditionalFields<typeof ServerAuthType>(),
  ],
});

// Destructure methods available on the coreAuthClient
// The availability of these depends on your SERVER-SIDE betterAuth configuration
export const {
  signUp,
  signOut,
  signIn,
  getSession, // Used for our refetch and by originalUseSessionHook
  sendVerificationEmail, // For initial email verification

  // Email OTP methods (from emailOTPClient plugin)
  // These are typically used for sign-in/sign-up with OTP, or passwordless.
  // For changing email, the flow might be more specific or use these.
  emailOtp, // This itself might be an object with send/verify methods

  // Password related methods (should be available if emailAndPassword enabled on server)
  // These names are common but double-check Better Auth's exact client API          // For changing password when logged in
  forgetPassword, // To send a password reset link
  resetPassword, // To set a new password using a token from reset link

  // OAuth related methods (should be available if OAuth providers configured on server)
  linkSocial,
  unlinkAccount,

  // User management
  deleteUser, // To delete the current user's account

  // Add other methods as needed based on Better Auth documentation and your setup
  // e.g., requestEmailChange, verifyEmailChangeOtp
} = coreAuthClient;

// --- Adapted useSession (remains the same as our last working version) ---
const originalUseSessionHook = coreAuthClient.useSession;
export const useSession = () => {
  const sessionHookApi = originalUseSessionHook;
  const currentSessionData = sessionHookApi.get(); // Assuming .get() is correct

  const refetch = async () => {
    try {
      await coreAuthClient.getSession();
    } catch (error) {
      console.error("Refetch error:", error);
    }
  };
  return { ...currentSessionData, refetch };
};

// The client object to be passed to AuthUIProvider if you were using it.
// For manual UI, we'll use the destructured methods or coreAuthClient directly.
export const authClient = coreAuthClient; // Export the core client for direct method calls
export type Session = ReturnType<typeof useSession>["data"];
