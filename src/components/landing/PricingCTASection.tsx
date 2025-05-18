"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingCtaSection() {
  return (
    <section id="pricing" className="bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary/80" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to Transform Your Collaboration?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          LARK offers a generous free tier to explore AI-powered insights and
          project management. Upgrade anytime for more power and features as
          your team grows.
        </p>
        <div className="mt-10">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group gap-x-2 px-8 py-4 text-lg", // Larger CTA
            )}
          >
            Sign Up & Get Free Credits
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {/* Optional: Link to a dedicated pricing page if you have one */}
        {/* <p className="mt-6 text-sm">
          <Link href="/pricing" className="font-medium text-primary hover:underline">
            View detailed pricing plans
          </Link>
        </p> */}
      </div>
    </section>
  );
}
