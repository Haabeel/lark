"use client";
import { signUpSchema } from "@/lib/validations/auth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, signIn } from "@/lib/auth-client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import FormInputField from "@/components/shared/FormInputField";
import SocialProviders from "@/components/shared/SocialProviders";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { LuMoveRight } from "react-icons/lu";
import Image from "next/image";
import signUpImage from "../../../../public/sign-in.png";
import { Separator } from "@/components/ui/separator";
import { useToggle } from "@/hooks/useToggle";
import { useRouter } from "next/navigation";
type SignUpForm = z.infer<typeof signUpSchema>;
const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useToggle(false);
  const [showConfirmPassword, setShowConfirmPassword] = useToggle(false);
  const router = useRouter();
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

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);

    try {
      const response = await signUp.email({
        email: data.email,
        password: data.password,
        name:
          data.lastName !== ""
            ? data.firstName + " " + data.lastName
            : data.firstName,
        firstName: data.firstName,
      });
      if (response.error) {
        toast.error(response.error.message);
      } else {
        router.push("/sign-up/verification");
        toast.success("Signed up successfully");
      }
    } catch {
      toast.error("Something went wrong...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto p-3 sm:h-screen md:overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-foundation-blue-900 dark:text-neutral-100 sm:gap-0">
        <div className="flex w-full items-center justify-between px-2 py-2 sm:px-8 sm:py-3">
          <Link href={"/"}>
            <Logo className="h-5 w-auto sm:h-8" />
          </Link>
          <Link
            href={"/sign-in"}
            className="flex items-center justify-between gap-2 text-[12px] hover:underline sm:text-sm md:text-xs"
          >
            <p>Already have an Account?</p>
            <LuMoveRight className="auto h-5" />
          </Link>
        </div>
        <div className="flex w-full flex-1 flex-col items-center justify-center rounded-lg sm:max-w-min">
          <h1 className="w-full text-xl font-semibold">Get Started</h1>
          <p className="mb-10 w-full text-neutral-500 dark:text-neutral-50">
            Welcome to Lark - Let&apos;s create your account.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-col items-center gap-2"
            >
              <div className="w-full flex-col items-center gap-3 sm:flex">
                <FormInputField
                  control={form.control}
                  label="First Name"
                  name="firstName"
                  placeholder="John"
                />
                <FormInputField
                  control={form.control}
                  label="Last Name"
                  name="lastName"
                  placeholder="Doe"
                />
              </div>
              <FormInputField
                control={form.control}
                label="Email"
                name="email"
                placeholder="john@example.com"
                type="email"
              />
              <FormInputField
                control={form.control}
                label="Password"
                name="password"
                placeholder="********"
                type={showPassword ? "text" : "password"}
                onToggle={setShowPassword}
                showPassword={showPassword}
              />
              <FormInputField
                control={form.control}
                label="Confirm Password"
                name="confirmPassword"
                placeholder="********"
                type={showConfirmPassword ? "text" : "password"}
                showPassword={showConfirmPassword}
                onToggle={setShowConfirmPassword}
              />
              <Button
                type="submit"
                className="mt-2 w-full bg-brand-blue-800 dark:bg-brand-blue-400"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
              <div className="flex w-full items-center gap-2 text-neutral-500 dark:text-neutral-100">
                <Separator className="shrink" />
                <p className="mx-2 shrink-0 text-center">Or</p>
                <Separator className="shrink" />
              </div>

              <div className={`flex w-full justify-between gap-3`}>
                <SocialProviders type="sign up" />
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Image
        src={signUpImage}
        alt="Sign Up"
        className="hidden h-full w-auto rounded-md lg:block"
      />
    </main>
  );
};

export default SignUp;
