"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button"; // from shadcn/ui
import { MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";

// For Aceternity UI Background Gradient Animation:
// 1. npx aceternity-ui add background-gradient-animation
// 2. Import it:
// import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"; // Path might vary

export function HeroSection() {
  return (
    // If using BackgroundGradientAnimation, wrap this section or use it as the direct child of a sized container
    // <BackgroundGradientAnimation
    //   gradientBackgroundStart="rgb(var(--background))"
    //   gradientBackgroundEnd="rgb(var(--muted))"
    //   firstColor="180, 100%, 70%" // Example teal/blue
    //   secondColor="220, 100%, 70%" // Example purple
    //   thirdColor="280, 100%, 70%" // Example magenta
    //   fourthColor="320, 100%, 70%" // Example pink
    //   fifthColor="0, 100%, 70%"   // Example red (adjust these to your branding)
    //   pointerColor="100, 100%, 80%"
    //   size="100%" // Or specific px value
    //   blendingValue="hard-light"
    //   className="relative z-0" // Ensure content is above
    // >
    <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-background pb-12 pt-24 sm:pb-16 sm:pt-32 md:min-h-screen">
      {/* Optional: Abstract background shapes or subtle grid */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80caff] to-[#4f46e5] opacity-20 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Supercharge Your <span className="text-brand-purple-500">GitHub</span>{" "}
          Workflow
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          LARK integrates AI-driven commit summaries, contextual codebase Q&A,
          real-time communication, and project management directly with your
          GitHub repositories.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "lg" }), "group gap-x-2")}
          >
            Get Started Now
            <MoveRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          {/* Optional: Watch Demo Button */}
          {/* <Link
            href="#demo" // Link to a demo video or section
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-x-2 group"
            )}
          >
            <PlayCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            Watch Demo
          </Link> */}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Free tier available. No credit card required.
        </p>
      </div>
      {/* This div is for the bottom gradient to make text more readable on complex backgrounds */}
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#4f46e5] to-[#80caff] opacity-20 dark:opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
    // </BackgroundGradientAnimation> // Closing tag if using Aceternity UI background
  );
}
