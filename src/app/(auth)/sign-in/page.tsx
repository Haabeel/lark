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

type SignInForm = z.infer<typeof signInSchema>;
const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const socialSignIn = async (
    OAuthProvider: "google" | "microsoft" | "github",
  ) => {
    setLoading(true);
    try {
      const response = await signIn.social({
        provider: OAuthProvider,
      });
      if (response.error) {
        toast(response.error.message);
      } else {
        toast("signing in...");
      }
    } catch {
      toast("Something went wrong...");
    } finally {
      setLoading(false);
    }
  };

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
      className={`flex h-full w-full flex-1 flex-col items-center justify-center`}
    >
      <div
        className={`flex h-full w-full items-center justify-center text-foundation-blue-900`}
      >
        <div className="max-w-min flex-1 rounded-lg border p-6 shadow-lg">
          <h2 className="text-center text-2xl font-semibold">Sign In</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                type="password"
              />
              <Button
                type="submit"
                className="w-full bg-brand-blue-800"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="flex w-full items-center gap-2 text-neutral-500">
                <Separator className="shrink" />
                <p className="mx-2 shrink-0 text-center">Or</p>
                <Separator className="shrink" />
              </div>
              <div
                className={`flex w-full flex-col justify-between gap-3 md:flex-row`}
              >
                <SocialProviders socialSignIn={socialSignIn} />
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
};

export default SignIn;
