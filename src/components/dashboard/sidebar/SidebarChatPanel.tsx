"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hash, MessageSquare, Plus, Users, Loader2 } from "lucide-react"; // Added Users, Loader2
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import React, { useState, useMemo } from "react"; // Added useMemo
import { type Channel as PrismaChannel } from "@prisma/client"; // Renamed to avoid conflict
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Added Avatar
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { type DMChannel } from "@/hooks/useUserDms"; // Your DMChannel type
import { useDashboard } from "@/providers/DashboardProvider"; // To get current user
import { initials } from "@/lib/utils";

interface Props {
  selectedProject: string; // This is projectId
  channels?: PrismaChannel[]; // Renamed to avoid conflict with 'channel' variable
  // DMs will be fetched internally now based on priority
  open: boolean;
  refetchProjectChannels?: () => void;
  // For Create Channel dialog. Ensure this is defined and available
  // createChannelMutation: ReturnType<typeof api.chat.createChannel.useMutation>;
  // newChannelName: string;
  // setNewChannelName: React.Dispatch<React.SetStateAction<string>>;
  // isCreateChannelDialogOpen: boolean;
  // setIsCreateChannelDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // handleCreateChannel: (e: React.FormEvent) => Promise<void>;
}

// It's cleaner if the Create Channel Dialog logic is part of this component
// or passed more explicitly. For now, assuming it's self-contained or handled by props.

const SidebarChatPanel = ({
  selectedProject, // This is the projectId
  channels: projectChannels,
  open,
  refetchProjectChannels,
}: Props) => {
  const router = useRouter();
  const dashboard = useDashboard();
  const currentUserId = dashboard?.user?.id;
  const project = dashboard?.project;
  const utils = api.useContext();
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([
    "project-members", // Open "Project Members" by default
    "channels", // Open "Channels" by default
  ]);
  // --- State for Create Channel Dialog (moved here for self-containment) ---
  const [isCreateChannelDialogOpen, setIsCreateChannelDialogOpen] =
    useState(false);
  const [newChannelNameInput, setNewChannelNameInput] = useState(""); // Renamed to avoid conflict

  const createChannelMutation = api.chat.createChannel.useMutation({
    onSuccess: async (data) => {
      toast.success(`Channel "${data?.name}" created successfully!`);
      setIsCreateChannelDialogOpen(false);
      setNewChannelNameInput("");
      await utils.chat.getChannels.invalidate({ projectId: selectedProject });
      await utils.chat.getAllUserChannelIds.invalidate();
      if (refetchProjectChannels) refetchProjectChannels();
    },
    onError: (error) =>
      toast.error(`Failed to create channel: ${error.message}`),
  });

  const handleOpenCreateChannelDialog = () => {
    setTimeout(() => setIsCreateChannelDialogOpen(true), 0);
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    // Renamed
    e.preventDefault();
    if (!newChannelNameInput.trim()) {
      toast.warning("Channel name cannot be empty.");
      return;
    }
    if (!selectedProject) {
      toast.error("No project selected.");
      return;
    }
    createChannelMutation.mutate({
      name: newChannelNameInput.trim(),
      projectId: selectedProject,
    });
  };
  // --- End of Create Channel Dialog Logic ---

  // 1. Fetch all existing global DMs for the current user
  const {
    data: existingGlobalDmsData, // These are DMChannel[]
    isLoading: isLoadingGlobalDms,
  } = api.chat.getUserDms.useQuery(
    undefined, // No input, uses authenticated user
    { enabled: !!currentUserId },
  );

  // 2. Fetch members of the currently selected project
  const {
    data: projectTeamMembersData, // Array of Member records, each with a nested User
    isLoading: isLoadingProjectMembers,
  } = api.project.getTeamMembers.useQuery(
    { projectId: selectedProject }, // selectedProject is projectId here
    { enabled: !!selectedProject && !!currentUserId },
  );

  // 3. Mutation to get or create a DM channel
  const getOrCreateDmMutation = api.chat.getOrCreateDmChannel.useMutation({
    onSuccess: (data) => {
      router.push(
        `/dashboard/${selectedProject}/direct-message/${data.channelId}`,
      );
      if (data.isNew) {
        toast.success("New direct message started!");
        utils.chat.getUserDms.invalidate().catch(console.error);
      }
    },
    onError: (error) => toast.error(`Failed to start DM: ${error.message}`),
  });

  const handleProjectMemberClick = (targetUserId: string) => {
    if (!currentUserId) {
      toast.error("User session not found.");
      return;
    }
    if (currentUserId === targetUserId) {
      toast.info("You cannot start a DM with yourself.");
      return;
    }
    getOrCreateDmMutation.mutate({ targetUserId });
  };

  // 4. Logic to separate DMs and prioritize Project Member DMs
  const { globalDmsToDisplay, projectMembersForDmList } = useMemo(() => {
    const defaultReturn = {
      globalDmsToDisplay: [],
      projectMembersForDmList: [],
    };
    if (!currentUserId || !existingGlobalDmsData) {
      return {
        ...defaultReturn,
        projectMembersForDmList:
          projectTeamMembersData
            ?.filter((pm) => pm.user.id !== currentUserId)
            .map((pm) => ({ ...pm.user, dmChannelId: undefined })) ?? [],
      };
    }

    const projectMemberUserIds = new Set(
      projectTeamMembersData?.map((pm) => pm.user.id) ?? [],
    );
    // Create a map of existing global DMs keyed by the other user's ID for quick lookup
    const globalDmsMapByOtherUserId = new Map<string, DMChannel>();
    existingGlobalDmsData.forEach((dm) => {
      if (dm.otherUserId) {
        // Ensure otherUserId is defined
        globalDmsMapByOtherUserId.set(dm.otherUserId, dm);
      }
    });

    const filteredGlobalDms = existingGlobalDmsData.filter((dm) => {
      if (!dm.otherUserId) return true; // Keep DMs if otherUserId is missing (e.g. older DM, should be cleaned)
      return !projectMemberUserIds.has(dm.otherUserId);
    });

    const membersWithDmInfo = (projectTeamMembersData ?? [])
      .filter((pm) => pm.user.id !== currentUserId) // Exclude self
      .map((pm) => {
        const existingDm = globalDmsMapByOtherUserId.get(pm.user.id);
        return {
          ...pm.user, // Spread user details: id, name, image
          dmChannelId: existingDm?.id, // If a DM already exists, store its channelId
        };
      });

    return {
      globalDmsToDisplay: filteredGlobalDms,
      projectMembersForDmList: membersWithDmInfo,
    };
  }, [currentUserId, existingGlobalDmsData, projectTeamMembersData]);

  return (
    <>
      <SidebarContent className={open ? "" : "pt-3"}>
        <Accordion
          type="multiple"
          value={openAccordionItems}
          onValueChange={setOpenAccordionItems}
          className="w-full space-y-6 px-2 py-1" // Adjust padding as needed
        >
          {/* Accordion Item for Global Direct Messages */}
          <AccordionItem value="global-dms">
            <AccordionTrigger className="rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:no-underline data-[state=open]:bg-accent">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                Direct Messages
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1">
              {/* Your existing content for global DMs */}
              {isLoadingGlobalDms && (
                <Loader2 className="mx-auto my-2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!isLoadingGlobalDms && globalDmsToDisplay.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  No other direct messages.
                </p>
              )}
              <ul className="space-y-0.5">
                {" "}
                {/* Using ul for semantic list */}
                {globalDmsToDisplay.map((dm) => (
                  <li key={dm.id}>
                    <Link
                      href={`/dashboard/${selectedProject}/direct-message/${dm.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <Avatar className="h-5 w-5 text-xs">
                        {dm.otherUserImage && (
                          <AvatarImage src={dm.otherUserImage} />
                        )}
                        <AvatarFallback>{initials(dm.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{dm.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Accordion Item for Project Members (for DMs) */}
          {selectedProject && (
            <AccordionItem value="project-members">
              <AccordionTrigger className="rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:no-underline data-[state=open]:bg-accent">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                  Project Members
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1">
                {isLoadingProjectMembers && (
                  <Loader2 className="mx-auto my-2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isLoadingProjectMembers &&
                  projectMembersForDmList.length === 0 && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No other members in this project.
                    </p>
                  )}
                <ul className="space-y-0.5">
                  {projectMembersForDmList.map((memberUser) => (
                    <li key={memberUser.id}>
                      <button // Using button for onClick elements
                        onClick={() => {
                          if (memberUser.dmChannelId) {
                            router.push(
                              `/dashboard/${selectedProject}/direct-message/${memberUser.dmChannelId}`,
                            );
                          } else {
                            handleProjectMemberClick(memberUser.id);
                          }
                        }}
                        disabled={
                          getOrCreateDmMutation.isPending &&
                          getOrCreateDmMutation.variables?.targetUserId ===
                            memberUser.id
                        }
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-50"
                      >
                        <Avatar className="h-5 w-5 text-xs">
                          {memberUser.image && (
                            <AvatarImage src={memberUser.image} />
                          )}
                          <AvatarFallback>
                            {initials(memberUser.name ?? "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{memberUser.name}</span>
                        {getOrCreateDmMutation.isPending &&
                          getOrCreateDmMutation.variables?.targetUserId ===
                            memberUser.id && (
                            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                          )}
                      </button>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Accordion Item for Project Channels */}
          {selectedProject && projectChannels && (
            <AccordionItem value="channels">
              <AccordionTrigger className="rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:no-underline data-[state=open]:bg-accent">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <Hash className="mr-2 h-4 w-4 flex-shrink-0" />
                    Channels
                  </div>
                  {project &&
                    project?.members.find(
                      (member) => member.userId === currentUserId,
                    )?.role === "MAINTAINER" && (
                      <div
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-0 hover:bg-accent hover:bg-foundation-neutral-200 focus-visible:bg-accent focus-visible:outline-none"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          handleOpenCreateChannelDialog();
                        }}
                        aria-label="Create new channel"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1">
                {/* Consider isLoadingChannels prop here */}
                <ul className="space-y-0.5">
                  {projectChannels.map((channel) => (
                    <li key={channel.id}>
                      <Link
                        href={`/dashboard/${selectedProject}/channel/${channel.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      >
                        <Hash className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {" "}
                          {channel.name ?? "channel"}{" "}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {projectChannels.length === 0 && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No channels yet.
                    </p>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </SidebarContent>

      {/* Create Channel Dialog */}
      <Dialog
        open={isCreateChannelDialogOpen}
        onOpenChange={setIsCreateChannelDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Enter a name for your new channel in this project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChannelSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="channel-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="channel-name"
                  value={newChannelNameInput}
                  onChange={(e) => setNewChannelNameInput(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. general"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  createChannelMutation.isPending || !newChannelNameInput.trim()
                }
              >
                {createChannelMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SidebarChatPanel;
