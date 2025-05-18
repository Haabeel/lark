"use client"; // This layout can be a client component to handle session

import { useSession } from "@/lib/auth-client"; // Your adapted useSession
import { RealtimeChannelProvider } from "@/providers/RealTimeProvider"; // Your existing provider
import { ChannelProvider } from "@/providers/ChannelProvider"; // Likely needed with RealtimeChannelProvider
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProgressProvider } from "@/providers/ProgressProvider";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only render children (and RealtimeChannelProvider) if session exists
  return (
    <ChannelProvider>
      {/* ChannelProvider often goes with RealtimeChannelProvider */}
      <RealtimeChannelProvider>
        <ProgressProvider>{children}</ProgressProvider>
      </RealtimeChannelProvider>
    </ChannelProvider>
  );
}
