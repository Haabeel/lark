"use client"; // Keep if you intend to have client-side interactions, though for this simple footer it might not be strictly necessary if Logo is also pure.

import Link from "next/link";
import { Github, Mail } from "lucide-react"; // Added Mail icon
import Logo from "../shared/Logo"; // Assuming Logo is a simple SVG or img component

export function Footer() {
  const currentYear = new Date().getFullYear();
  const contactEmail = "larkae.ai@gmail.com"; // Replace with your actual contact email
  const githubRepoUrl = "https://github.com/Haabeel/lark"; // Replace with your actual GitHub repo URL

  return (
    <footer className="border-t border-border bg-muted/20 dark:bg-background">
      {" "}
      {/* Adjusted dark mode background for better contrast if needed */}
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">
          {/* Column 1: Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo className="size-10" />
              <span className="text-xl font-semibold text-foreground">
                LARK
              </span>
            </Link>
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} LARK. All rights reserved. <br />
              AI-Powered GitHub Collaboration.
            </p>
          </div>

          {/* Column 2: Important Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#features"
                  className="text-muted-foreground hover:text-primary"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-muted-foreground hover:text-primary"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Support & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a // Using <a> for mailto
                  href={`mailto:${contactEmail}`}
                  className="flex items-center justify-center gap-1.5 text-muted-foreground hover:text-primary md:justify-start"
                >
                  <Mail className="h-4 w-4" /> Contact Us
                </a>
              </li>
              <li>
                <a // Using <a> for external link
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-muted-foreground hover:text-primary md:justify-start"
                  aria-label="LARK GitHub Repository"
                >
                  <Github className="h-4 w-4" /> GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Optional: A small message or social links at the very bottom */}
        <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          <p>Built with passion for developers. 🚀</p>
        </div>
      </div>
    </footer>
  );
}
