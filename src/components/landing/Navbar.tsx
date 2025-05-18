"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard } from "lucide-react"; // Added LayoutDashboard
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client"; // Your adapted useSession hook
import Logo from "../shared/Logo";

export function Navbar() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const isAuthenticated = !!sessionData?.user;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled || isMobileMenuOpen
          ? "bg-background/95 shadow-md backdrop-blur-sm" // More opacity
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-foreground"
        >
          <Logo className="size-16" />
          <span>LARK</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs: Conditional Rendering */}
        <div className="hidden items-center space-x-3 md:flex">
          {isSessionPending ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div> // Placeholder for loading
          ) : isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard">
                {" "}
                {/* Adjust if your dashboard path is different */}
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 bg-background shadow-lg md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMobileMenu}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="flex flex-col space-y-3">
              {isSessionPending ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
              ) : isAuthenticated ? (
                <Button asChild className="w-full" onClick={closeMobileMenu}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full"
                    onClick={closeMobileMenu}
                  >
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full" onClick={closeMobileMenu}>
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
