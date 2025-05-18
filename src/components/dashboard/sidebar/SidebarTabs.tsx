"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SidebarAppPanel from "./SidebarAppPanel";
import SidebarChatPanel from "./SidebarChatPanel";
import { type Channel } from "@prisma/client";
import { type DMChannel } from "@/hooks/useUserDms";

interface Props {
  selectedProject: string;
  open: boolean;
  channels?: Channel[];
  dms?: DMChannel[];
  activeTab: "app" | "chat";
  setActiveTab: (tab: "app" | "chat") => void;
}

const SidebarTabs = ({
  selectedProject,
  open,
  channels,
  dms,
  activeTab,
  setActiveTab,
}: Props) => {
  return (
    <Tabs defaultValue={activeTab} className="flex w-full flex-col self-center">
      <TabsList
        className={`"flex ${open ? "w-[90%]" : "hidden w-0"} items-center justify-center self-center rounded-sm border-b border-border bg-muted transition`}
      >
        {["app", "chat"].map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            onClick={() => setActiveTab(tab as "app" | "chat")}
            className={cn(
              "flex-1 rounded-sm px-2 py-1 text-center text-xs font-medium transition-colors",
              "data-[state=active]:bg-brand-blue-500 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {tab === "app" ? "Application" : "Chat"}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="app" className="p-0">
        <SidebarAppPanel selectedProject={selectedProject} open={open} />
      </TabsContent>

      <TabsContent value="chat" className="p-0">
        <SidebarChatPanel
          selectedProject={selectedProject}
          channels={channels}
          open={open}
        />
      </TabsContent>
    </Tabs>
  );
};

export default SidebarTabs;
