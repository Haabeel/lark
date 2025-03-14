"use client";
import React, { useState } from "react";
import { signInSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type z from "zod";
import { FaGoogle, FaMicrosoft, FaGithub } from "react-icons/fa";
import { toast } from "sonner";

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
    } catch (error) {
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
    } catch (error) {
      toast.error("Something went wrong...");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg border p-6 shadow-lg">
      <h2 className="text-center text-2xl font-semibold">Sign In</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className={`flex w-full gap-5`}>
            <Button
              type="button"
              className={`flex w-full items-center justify-around`}
              onClick={() => socialSignIn("google")}
            >
              <FaGoogle />
              <p>Sign in with Google</p>
            </Button>
            <Button
              type="button"
              className={`flex w-full items-center justify-around`}
              onClick={() => socialSignIn("microsoft")}
            >
              <FaMicrosoft />
              <p>Sign in with Microsoft</p>
            </Button>
            <Button
              type="button"
              className={`flex w-full items-center justify-around`}
              onClick={() => socialSignIn("github")}
            >
              <FaGithub />
              <p>Sign in with Github</p>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SignIn;
