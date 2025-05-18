"use client";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";
import { PricingCtaSection } from "@/components/landing/PricingCTASection";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { api } from "@/trpc/react";

export default function Home() {
  const { data: session, isLoading, refetch } = api.auth.getSession.useQuery();
  const handleSignOut = async () => {
    try {
      await signOut();
      await refetch();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingCtaSection />
      <Footer />
    </div>
  );
}
