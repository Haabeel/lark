"use client";
import React, { useState } from "react";
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
  ListTodo,
  ChartLine,
  Users,
  GitGraphIcon,
  Hash,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Combobox } from "../ui/combobox";
import { type Project } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming you have shadcn tabs component installed

interface Props {
  projects: Project[] | undefined;
  selectedProject: string;
  setSelectedProject: (newProjectId: string) => void;
  channels: { id: string; name: string }[] | undefined; // Add channels prop
  dms: { id: string; name: string }[] | undefined; // Add dms prop
}

const items = {
  ai: [
    { name: "Commits", url: "commits", icon: GitGraphIcon },
    { name: "Q&A", url: "qa", icon: Bot },
  ],
  management: [
    { name: "Project", url: "project", icon: LayoutDashboard },
    { name: "Members", url: "members", icon: Users },
    { name: "Tasks", url: "tasks", icon: ListTodo },
    { name: "Analytics", url: "analytics", icon: ChartLine },
  ],
};

const AppSidebar = ({
  projects,
  selectedProject,
  setSelectedProject,
  channels,
  dms,
}: Props) => {
  const pathname = usePathname();
  const { open } = useSidebar();
  const [activeTab, setActiveTab] = useState<"app" | "chat">("app");

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="flex h-full flex-col"
    >
      {/* Header */}
      <SidebarHeader>
        <div
          className={`flex w-full items-center justify-center gap-2 ${
            open && "px-2"
          }`}
        >
          <Logo className="h-8 w-auto" />
          {open && <h1 className="text-2xl font-bold">LARK</h1>}
        </div>
      </SidebarHeader>

      {/* Main body: flex-grow to push the footer to the bottom */}
      <div className="flex flex-grow flex-col">
        {/* Tab Navigation using shadcn Tabs */}
        <Tabs defaultValue={activeTab} className="w-[90%] self-center">
          <TabsList className="flex w-full items-center justify-center rounded-sm border-b border-border bg-muted">
            <TabsTrigger
              value="app"
              onClick={() => setActiveTab("app")}
              className={cn(
                "flex-1 rounded-sm px-2 py-1 text-center text-xs font-medium transition-colors",
                "data-[state=active]:bg-brand-blue-500 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              Application
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 rounded-sm px-2 py-1 text-center text-xs font-medium transition-colors",
                "data-[state=active]:bg-brand-blue-500 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              Chat
            </TabsTrigger>
          </TabsList>
          <TabsContent value="app" className="line-none p-0">
            <SidebarContent className={`${!open && "pt-3"}`}>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <span className="text-md mr-1">🚀</span>AI Insights
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.ai.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={`/dashboard/${selectedProject}/${item.url}`}
                            className={cn(
                              {
                                "!dark:bg-brand-blue-700 bg-brand-blue-500 text-white":
                                  pathname ===
                                  `/dashboard/${selectedProject}/${item.url}`,
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
              <SidebarGroup>
                <SidebarGroupLabel>
                  <span className="text-md mr-1">🗂️</span>Management
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.management.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={`/dashboard/${selectedProject}/${item.url}`}
                            className={cn(
                              {
                                "!dark:bg-brand-blue-700 bg-brand-blue-500 text-white":
                                  pathname ===
                                  `/dashboard/${selectedProject}/${item.url}`,
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
          </TabsContent>
          <TabsContent value="chat" className="line-none p-0">
            <SidebarContent className={`${!open && "pt-3"}`}>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <span className="text-md mr-1">#</span>Channels
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {channels?.map((channel) => (
                      <SidebarMenuItem key={channel.id}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={`/dashboard/${selectedProject}/channel/${channel.id}`} // Adjust URL as needed
                            className="list-none hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50"
                          >
                            <Hash />
                            <span>{channel.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`/dashboard/${selectedProject}/create-channel`}
                          className="list-none hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50"
                        >
                          <Plus />
                          <span>Create Channel</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <span className="text-md mr-1">💬</span>Direct Messages
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {dms?.map((dm) => (
                      <SidebarMenuItem key={dm.id}>
                        <SidebarMenuButton asChild>
                          <Link
                            href={`/dashboard/${selectedProject}/dm/${dm.id}`} // Adjust URL as needed
                            className="list-none hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50"
                          >
                            <MessageSquare />
                            <span>{dm.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link
                          href={`/dashboard/${selectedProject}/create-dm`}
                          className="list-none hover:bg-foundation-blue-600 hover:text-black hover:dark:bg-foundation-blue-800 hover:dark:text-neutral-50 focus:dark:bg-foundation-blue-600 focus:dark:text-neutral-50"
                        >
                          <Plus />
                          <span>Create DM</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </TabsContent>
        </Tabs>

        {/* Button pinned to bottom of content area */}
        <div className="mt-auto p-2">
          <Link
            href="/dashboard/create-project"
            className={`relative flex h-8 items-center justify-center gap-2 overflow-hidden rounded-md bg-foundation-purple-400 ${
              open ? "w-full p-2" : "w-8 p-0"
            } text-sm text-white transition-all duration-300 hover:bg-purple-700`}
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
