"use client";
import React, { useState } from "react";
import { signInSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type z from "zod";
import { toast } from "sonner";
import FormInputField from "@/components/shared/FormInputField";
import { Separator } from "@/components/ui/separator";
import SocialProviders from "@/components/shared/SocialProviders";
import Image from "next/image";
import signInImage from "../../../../public/sign-in.png";
import Logo from "@/components/shared/Logo";
import Link from "next/link";
import { LuMoveRight } from "react-icons/lu";
import { useToggle } from "@/hooks/useToggle";

type SignInForm = z.infer<typeof signInSchema>;
const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useToggle(false);
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInForm) => {
    setLoading(true);

    try {
      const response = await signIn.email({
        email: data.email,
        password: data.password,
      });
      if (response.error) {
        toast.error(response.error.message);
      } else {
        toast.success("signing in...");
      }
    } catch {
      toast.error("Something went wrong...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`flex h-screen w-full items-center justify-center overflow-hidden p-3 sm:h-screen md:overflow-hidden`}
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-5 text-foundation-blue-900 dark:text-neutral-50 sm:gap-0`}
      >
        <div
          className={`flex w-full items-center justify-between px-2 py-2 sm:px-8 sm:py-3`}
        >
          <Link href={"/"}>
            <Logo className="h-5 w-auto sm:h-8" />
          </Link>
          <Link
            href={"/sign-up"}
            className="flex items-center justify-between gap-2 text-[12px] hover:underline sm:text-sm md:text-xs"
          >
            <p>Create an account</p>
            <LuMoveRight className="h-5 w-auto" />
          </Link>
        </div>
        <div className="flex w-full flex-1 flex-col items-center rounded-lg sm:max-w-min sm:justify-center">
          <h1 className="w-full text-xl font-semibold">Welcome Back to Lark</h1>
          <p className="mb-12 w-full text-neutral-500 dark:text-neutral-50 sm:mb-10">
            Enter your email and password to continue.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-col items-center gap-2"
            >
              <FormInputField
                control={form.control}
                name="email"
                label="Email"
                placeholder="johndoe@gmail.com"
              />
              <FormInputField
                control={form.control}
                name="password"
                label="Password"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                showPassword={showPassword}
                onToggle={setShowPassword}
              />
              <p className="w-full text-end text-xs text-black dark:text-neutral-50">
                Forgot Password
              </p>
              <Button
                type="submit"
                className="w-full bg-brand-blue-800 dark:bg-brand-blue-400"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="flex w-full items-center gap-2 text-neutral-500 dark:text-neutral-100">
                <Separator className="shrink" />
                <p className="mx-2 shrink-0 text-center">Or</p>
                <Separator className="shrink" />
              </div>
              <div className={`flex w-full justify-between gap-3`}>
                <SocialProviders />
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Image
        src={signInImage}
        alt="Sign in"
        className={`hidden h-full w-auto rounded-md lg:block`}
      />
    </main>
  );
};

export default SignIn;
