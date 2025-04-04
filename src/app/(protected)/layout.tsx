import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardProvider from "@/providers/DashboardProvider";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const SidebarLayout = ({ children }: Props) => {
  return (
    <DashboardProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
};

export default SidebarLayout;
