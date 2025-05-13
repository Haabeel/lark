"use client";
import React, { type Dispatch, type SetStateAction } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import Logo from "../shared/Logo";
import {
  Bot,
  LayoutDashboard,
  Plus,
  Presentation,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Combobox } from "../ui/combobox";
import { type Project } from "@prisma/client";

interface Props {
  projects: Project[] | undefined;
  selectedProject: string;
  setSelectedProject: Dispatch<SetStateAction<string>>;
}

const items = [
  { name: "Commits", url: "/commits", icon: LayoutDashboard },
  { name: "Q&A", url: "/qa", icon: Bot },
  { name: "Meetings", url: "/meetings", icon: Presentation },
  { name: "Tasks", url: "/tasks", icon: ListTodo },
];

const AppSidebar = ({
  projects,
  selectedProject,
  setSelectedProject,
}: Props) => {
  const pathname = usePathname();
  const { open } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="flex h-full flex-col"
    >
      {/* Header */}
      <SidebarHeader>
        <div
          className={`flex w-full items-center justify-center gap-2 ${open && "px-2"}`}
        >
          <Logo className="h-8 w-auto" />
          {open && <h1 className="text-2xl font-bold">LARK</h1>}
        </div>
      </SidebarHeader>

      {/* Main body: flex-grow to push the footer to the bottom */}
      <div className="flex flex-grow flex-col">
        {/* Sidebar content */}
        <SidebarContent className={`${!open && "pt-3"}`}>
          <SidebarGroup>
            <SidebarGroupLabel>
              <span className="text-md mr-1">🚀</span>AI Insights
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          {
                            "!dark:bg-brand-blue-700 bg-brand-blue-500 text-white":
                              pathname === item.url,
                          },
                          "list-none hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50",
                        )}
                      >
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Button pinned to bottom of content area */}
        <div className="mt-auto p-2">
          <Link
            href="/create-project"
            className={`relative flex h-8 items-center justify-center gap-2 overflow-hidden rounded-md bg-foundation-purple-400 ${open ? "w-full p-2" : "w-8 p-0"} text-sm text-white transition-all duration-300 hover:bg-purple-700`}
          >
            <Plus className={`${open ? "size-5" : "size-4"}`} strokeWidth={2} />
            {open && (
              <span
                className={`transition-opacity duration-300 group-hover:opacity-100`}
              >
                Create Project
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter className="border-t-[1px] border-neutral-300 p-0">
        <div className="w-full px-2">
          <Combobox
            expanded={open}
            items={
              projects
                ? projects.map((project) => ({
                    value: project.id,
                    label: project.name,
                    backgroundColor: project.backgroundColor,
                  }))
                : []
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
