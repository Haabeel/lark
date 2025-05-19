import EmailVerification from "@/components/EmailVerification";
import Logo from "@/components/shared/Logo";
import { api } from "@/trpc/server";
import Link from "next/link";
import React from "react";
import verificationImage from "../../../../../public/sign-in.png";
import Image from "next/image";

const VerifyOTP = async () => {
  const session = await api.auth.getSession();
  return (
    <main className="flex h-screen w-full items-center justify-center overflow-hidden p-3 sm:h-screen md:overflow-hidden">
      <div className="relative flex h-full w-full flex-col items-start justify-start gap-5 text-foundation-blue-900 sm:gap-0">
        <div className="flex w-full items-center justify-between px-2 py-2 sm:px-8 sm:py-3">
          <Link href="/">
            <Logo className="h-5 w-auto sm:h-8" />
          </Link>
        </div>
        <div className="absolute left-1/2 top-1/2 flex flex-1 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg">
          <h1 className="text-center text-xl font-semibold text-black dark:text-neutral-100">
            Verify your email address
          </h1>
          <p className="mb-10 text-center text-neutral-500 dark:text-neutral-300 sm:mb-8">
            To start using Lark, please verify your email by entering the
            confirmation code we just sent you.
          </p>
          {session ? (
            <div className="flex flex-col items-center justify-center gap-3 text-black dark:text-neutral-100">
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
      </div>
      <Image
        src={verificationImage}
        alt="Email verification"
        className="hidden h-full w-auto rounded-md lg:block"
      />
    </main>
  );
};

export default VerifyOTP;
