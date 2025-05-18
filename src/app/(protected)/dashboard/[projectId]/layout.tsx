import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardProvider from "@/providers/DashboardProvider";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const SidebarLayout = ({ children }: Props) => {
  return (
    <DashboardProvider>
      <SidebarProvider className="overflow-hidden p-2 dark:bg-foundation-blue-900 dark:text-neutral-100">
        <DashboardLayout>{children}</DashboardLayout>
      </SidebarProvider>
    </DashboardProvider>
  );
};

export default SidebarLayout;
