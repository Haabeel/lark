import "@/styles/globals.css";

import { type Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import StyledComponentsRegistry from "@/lib/StyledComponentsRegistry";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Lark AI",
  description:
    "Lark AI is an AI-powered collaboration platform for GitHub projects, offering commit summaries, contextual Q&A, real-time communication, and project management tools to enhance team productivity.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${dmSans.className} flex min-h-screen w-screen flex-col overflow-x-hidden bg-foundation-neutral-200 dark:bg-foundation-blue-800 dark:text-foundation-neutral-200`}
      >
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
