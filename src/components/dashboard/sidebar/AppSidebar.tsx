"use client";
import { useState } from "react";
import { Sidebar, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Combobox } from "@/components/ui/combobox";
import Logo from "@/components/shared/Logo";
import Link from "next/link";
import { Plus } from "lucide-react";
import SidebarTabs from "./SidebarTabs";
import { useSidebar } from "@/components/ui/sidebar";
import type { Channel, Project } from "@prisma/client";
import { type DMChannel } from "@/hooks/useUserDms";

interface Props {
  projects: Project[] | undefined;
  selectedProject: string;
  setSelectedProject: (newProjectId: string) => void;
  channels: Channel[] | undefined;
  dms: DMChannel[] | undefined;
}

const AppSidebar = ({
  projects,
  selectedProject,
  setSelectedProject,
  channels,
  dms,
}: Props) => {
  const { open } = useSidebar();
  const [activeTab, setActiveTab] = useState<"app" | "chat">("app");

  return (
    <Sidebar
      collapsible={activeTab === "app" ? "icon" : "offcanvas"}
      variant="inset"
      className="flex h-full flex-col"
    >
      <SidebarHeader>
        <div
          className={`flex w-full items-center justify-center gap-2 ${open && "px-2"}`}
        >
          <Logo className="h-8 w-auto" />
          {open && <h1 className="text-2xl font-bold">LARK</h1>}
        </div>
      </SidebarHeader>

      <div className="flex flex-grow flex-col">
        <SidebarTabs
          selectedProject={selectedProject}
          open={open}
          channels={channels}
          dms={dms}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="mt-auto p-2">
          <Link
            href="/dashboard/create-project"
            className={`relative flex h-8 items-center justify-center gap-2 overflow-hidden rounded-md bg-foundation-purple-400 ${
              open ? "w-full p-2" : "w-8 p-0"
            } text-sm text-white transition-all duration-300 hover:bg-purple-700`}
          >
            <Plus className={`${open ? "size-5" : "size-4"}`} strokeWidth={2} />
            {open && (
              <span className="transition-opacity duration-300">
                Create Project
              </span>
            )}
          </Link>
        </div>
      </div>

      <SidebarFooter className="border-t-[1px] border-neutral-300 p-0">
        <div className="w-full px-2">
          <Combobox
            expanded={open}
            items={
              projects?.map((p) => ({
                value: p.id,
                label: p.name,
                backgroundColor: p.backgroundColor,
              })) ?? []
            }
            value={selectedProject}
            onChangeAction={setSelectedProject}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
