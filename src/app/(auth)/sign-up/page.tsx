"use client";
import { signUpSchema } from "@/lib/validations/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signIn } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";
import EmailVerification from "@/components/EmailVerification";
import { api } from "@/trpc/react";

type SignUpForm = z.infer<typeof signUpSchema>;
const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const socialSignIn = async (
    OAuthProvider: "google" | "microsoft" | "github",
  ) => {
    setLoading(true);
    try {
      const response = await signIn.social(
        {
          provider: OAuthProvider,
        },
        {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      );
      if (response.error) {
        console.log("error", response.error);
      } else {
        console.log("success");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);

    try {
      const response = await signUp.email(
        {
          email: data.email,
          password: data.password,
          name:
            data.lastName !== ""
              ? data.firstName + " " + data.lastName
              : data.firstName,
        },
        {
          onSuccess: () => {
            window.location.href = "/sign-up/verification";
          },
        },
      );
      if (response.error) {
        console.log("error", response.error);
      } else {
        console.log("success");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 rounded-lg border p-6 shadow-lg">
      <h2 className="text-center text-2xl font-semibold">Create an Account</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <Label>First Name</Label>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <Label>Last Name</Label>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label>Email</Label>
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

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label>Password</Label>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <Label>Confirm Password</Label>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
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

export default SignUp;
