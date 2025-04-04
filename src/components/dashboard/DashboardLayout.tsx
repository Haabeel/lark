"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { initials } from "@/lib/utils";
import { useDashboard } from "@/providers/DashboardProvider";
import React, { useMemo } from "react";
import AppSidebar from "./AppSidebar";

type Props = {
  children: React.ReactNode;
};

const SidebarContent = ({ children }: Props) => {
  const dashboard = useDashboard();
  const [hasFetchingError, setHasFetchingError] = React.useState(false);
  if (!dashboard) return null;

  const { session } = dashboard;
  const name = initials(session?.user.name ?? "");
  return (
    <SidebarProvider className="h-screen overflow-hidden bg-white p-2">
      <AppSidebar />
      <main className="flex h-full w-full flex-col">
        <div className="flex items-center gap-2 border-b-2 border-border p-2 pt-1">
          <div className="ml-auto"></div>
          <Avatar>
            {session?.user.image && hasFetchingError ? (
              <AvatarImage
                src={session?.user.image}
                key={session.user.id}
                onError={() => setHasFetchingError(true)}
              />
            ) : (
              <AvatarFallback className="bg-foundation-purple-300">
                {name}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
};

export default SidebarContent;
