"use client";
import React from "react";
import Logo from "@/components/shared/Logo";
import Link from "next/link";
import { api } from "@/trpc/react";

const Navbar = () => {
  const session = api.auth.getSession.useQuery();
  return (
    <div className="mx-5 my-2 flex items-center gap-6 px-[20px] py-[8px] text-xs md:px-[40px] md:py-[16px] md:text-sm">
      <Link href="/" className={`flex items-center justify-center gap-[7px]`}>
        <Logo className="h-auto w-[60px] md:w-[85px]" />
        {/* <h1 className="text-xl font-bold text-foundation-blue-700 md:text-4xl"> */}
        {/*   LARK */}
        {/* </h1> */}
      </Link>
      <section
        className={`flex items-center justify-center gap-5 rounded-md border border-foundation-blue-700 bg-transparent px-[15px] py-[4px] md:gap-10 md:px-[30px] md:py-[6px]`}
      >
        {["Why Lark?", "Features", "Pricing", "Contact Us"].map(
          (item, index) => (
            <h2 key={index} className="text-foundation-blue-700">
              {item}
            </h2>
          ),
        )}
      </section>
      <section
        className={`ml-auto flex items-center justify-center gap-3 py-[4px] md:gap-5 md:py-[6px]`}
      >
        {!session.data ? (
          <>
            <Link
              href={"/sign-in"}
              className={`test-xs text-foundation-blue-700`}
            >
              Login
            </Link>
            <Link
              href={"/sign-up"}
              className={`flex items-center justify-center rounded-md border border-foundation-blue-900 bg-foundation-blue-500 px-[8px] py-[4px] text-foundation-neutral-100 md:px-[12px]`}
            >
              Sign Up
            </Link>
          </>
        ) : (
          <Link
            href="/dashboard"
            className={`flex items-center justify-center rounded-[6px] border border-brand-purple-500 bg-brand-purple-300 px-[8px] py-[4px] text-foundation-neutral-100 md:px-[12px]`}
          >
            Dashboard
          </Link>
        )}
      </section>
    </div>
  );
};

export default Navbar;
