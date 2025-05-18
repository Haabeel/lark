"use client"; // This layout can be a client component to handle session

import { ChannelProvider } from "@/providers/ChannelProvider"; // Likely needed with RealtimeChannelProvider
import { ProgressProvider } from "@/providers/ProgressProvider";
import { RealtimeChannelProvider } from "@/providers/RealTimeProvider"; // Your existing provider

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
