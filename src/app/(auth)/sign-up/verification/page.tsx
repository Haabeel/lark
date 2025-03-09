import EmailVerification from "@/components/EmailVerification";
import { api } from "@/trpc/server";
import React from "react";

const VerifyOTP = async () => {
  const session = await api.auth.getSession();
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      {session ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <p>{session.user.email}</p>
          <EmailVerification
            email={session.user.email}
            isEmailVerified={session.user.emailVerified}
          />
        </div>
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
};

export default VerifyOTP;
