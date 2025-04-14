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
import { Bot, LayoutDashboard, Presentation } from "lucide-react";
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
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Q&A", url: "/qa", icon: Bot },
  { name: "Meetings", url: "/meetings", icon: Presentation },
];

const AppSidebar = ({
  projects,
  selectedProject,
  setSelectedProject,
}: Props) => {
  const pathname = usePathname();
  const { open } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <div
          className={`flex w-full items-center justify-center gap-2 ${open && "px-2"}`}
        >
          <Logo className="h-8 w-auto" />
          {open && <h1 className="text-2xl font-bold">LARK</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent className={`${!open && "pt-3"}`}>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        {
                          "!bg-brand-blue-700 !text-white":
                            pathname === item.url,
                        },
                        "list-none hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-800 focus:dark:text-neutral-50",
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
      <SidebarFooter className="border-t-[1px] border-neutral-300 p-0">
        <div>
          <Combobox
            expanded={open}
            items={
              projects
                ? projects.map((project) => {
                    return {
                      value: project.id,
                      label: project.name,
                      backgroundColor: project.backgroundColor,
                    };
                  })
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
