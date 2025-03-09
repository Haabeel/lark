"use client";
import { Button } from "@/components/ui/button";
import { signOut, sendVerificationEmail, emailOtp } from "@/lib/auth-client";
import { api } from "@/trpc/react";

export default function Home() {
  const { data: session, isLoading, refetch } = api.auth.getSession.useQuery();
  const handleSignOut = async () => {
    try {
      await signOut(); // Sign the session out
      await refetch();
      console.log("session signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const sendEmail = async () => {
    if (!session) return console.log("No session found");
    await emailOtp.sendVerificationOtp({
      email: session.user.email,
      type: "email-verification",
    });
  };

  return (
    <main>
      {isLoading && <p>Loading...</p>}
      {session ? (
        <div>
          <p>{session.user.id}</p>
          <Button onClick={handleSignOut}>Sign out</Button>
          <Button onClick={sendEmail}>Send Verification Email</Button>
        </div>
      ) : (
        <div>No signed in session</div>
      )}
    </main>
  );
}
