"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation"; // Added useRouter for potential navigation
import {
  Hash,
  Menu,
  Users,
  Pencil,
  MoreVertical,
  ArchiveXIcon,
  UserPlus, // Changed from WaypointsIcon for "Add Members" for better semantics
  ShieldAlert, // For the "Not a Member" screen
  Loader2, // For loading states
} from "lucide-react";

import {
  useSetActiveChannelId,
  useActiveChannelMessages,
  useIsLoadingMessages,
} from "@/providers/ChannelProvider";
import MessageList from "@/components/dashboard/channel/MessageList";
import ChatInput from "@/components/dashboard/channel/ChatInput";
import { useProjectChannels } from "@/hooks/useProjectChannels";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/react";
import { initials } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDashboard } from "@/providers/DashboardProvider";
import MessageListSkeleton from "@/components/dashboard/channel/MessagesSkeleton";

// --- "Not a Member of Channel" Component ---
const NotAMemberOfChannel = ({ channelName }: { channelName?: string }) => {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-md bg-foundation-neutral-200 p-6 text-center dark:bg-foundation-blue-900">
      <ShieldAlert className="mb-6 h-16 w-16 text-yellow-500" />
      <h2 className="mb-3 text-2xl font-semibold text-foreground">
        Access Denied to {channelName ? `"${channelName}"` : "Channel"}
      </h2>
      <p className="mb-2 text-muted-foreground">
        You are not currently a member of this channel.
      </p>
      <p className="mb-6 text-sm text-muted-foreground/80">
        To gain access, please request an invitation from a project maintainer.
      </p>
      <Button variant="outline" onClick={() => router.back()}>
        Go Back
      </Button>
    </div>
  );
};

// --- Main Channel Page Component ---
const ChannelPage = () => {
  const { channelId } = useParams<{ channelId?: string }>(); // Ensure channelId can be undefined initially
  const router = useRouter(); // For navigation if needed

  const dashboard = useDashboard();
  const currentUserId = dashboard?.user?.id;

  const utils = api.useContext(); // For invalidating queries
  // ---- If user is a member (or it's a DM and they are presumed member until data proves otherwise), render channel ----

  // Hooks and state specific to when the user has access to the channel
  const messages = useActiveChannelMessages();
  const isMessagesLoading = useIsLoadingMessages();

  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null); // This should be Member.id
  const [newChannelName, setNewChannelName] = useState("");
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]); // Array of Member.id
  const {
    channels: projectChannelsList,
    isLoading: isLoadingProjectChannels,
    isError: isProjectChannelsError,
  } = useProjectChannels();

  const channel = useMemo(
    () => projectChannelsList.find((c) => c.id === channelId),
    [projectChannelsList, channelId],
  );
  const { data: projectMembersData } = api.project.getTeamMembers.useQuery(
    { projectId: channel?.projectId ?? "" },
    { enabled: !!channel?.projectId },
  );

  const {
    data: channelMembersData,
    isLoading: isLoadingChannelMembers,
    isError: isChannelMembersError,
    refetch: refetchChannelMembers, // Use this for refreshing members list
  } = api.chat.getChannelMembers.useQuery(
    { channelId: channel?.id ?? "" },
    {
      enabled: !!channel?.id && !!currentUserId && !channel.isDm, // Primarily for non-DM channels
      // For DMs, membership is usually implicit or checked differently
    },
  );

  const isCurrentUserMember = useMemo(() => {
    if (!channel || !currentUserId) return false;
    if (channel.isDm) {
      // For DMs, membership check is different.
      // A simple check might be if the channel name implies the other user,
      // or if `channelMembersData` (if fetched for DMs) includes currentUserId.
      // This part depends on how your DMs are structured and fetched.
      // A common pattern for DMs is to check if the current user is one of the two participants.
      // Assuming `getChannelMembers` can also return members for DMs directly via `userId`.
      return channelMembersData?.some(
        (cm) =>
          cm.userId === currentUserId || cm.member?.user?.id === currentUserId,
      );
    }
    // For project channels
    return channelMembersData?.some(
      (cm) => cm.member?.user?.id === currentUserId,
    );
  }, [channel, currentUserId, channelMembersData]);

  const setActiveChannelId = useSetActiveChannelId(); // To set context for messages

  const commonMutationOptions = {
    onSuccess: () => {
      if (!channel) return;
      // Refetch data that might have changed
      utils.chat.getChannels
        .invalidate({ projectId: channel.projectId ?? undefined })
        .catch(console.error);
      utils.chat.getChannelMembers
        .invalidate({ channelId: channel.id })
        .catch(console.error);
      refetchChannelMembers().catch(console.error); // Specific refetch for current members
      // If using SidebarContent filtering:
      utils.chat.getAllUserChannelIds
        .invalidate({ userId: currentUserId })
        .catch(console.error);
    },
  };

  const updateChannelMutation = api.chat.updateChannel.useMutation(
    commonMutationOptions,
  );
  const deleteChannelMutation = api.chat.deleteChannel.useMutation({
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      toast.success("Channel deleted successfully");
      if (!channel) return;
      router.push(`/dashboard/${channel.projectId}`); // Navigate away after deletion
    },
  });

  // Effect to set active channel ID *after* membership is confirmed
  useEffect(() => {
    if (
      channelId &&
      channel &&
      !isLoadingChannelMembers &&
      isCurrentUserMember
    ) {
      setActiveChannelId(channelId);
    }
  }, [
    channelId,
    channel,
    setActiveChannelId,
    isLoadingChannelMembers,
    isCurrentUserMember,
  ]);

  // ---- Loading and Early Exit States ----
  if (!dashboard || !currentUserId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading user
        session...
      </div>
    );
  }

  if (isLoadingProjectChannels) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading channels...
      </div>
    );
  }

  if (isProjectChannelsError || !channel) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Hash className="mb-6 h-16 w-16 text-destructive" />
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          Channel Not Found
        </h2>
        <p className="text-muted-foreground">
          The channel you are looking for does not exist or you may not have
          permission.
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // For non-DM channels, wait for members to load before checking membership
  if (!channel.isDm && isLoadingChannelMembers) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <MessageListSkeleton />
      </div>
    );
  }

  if (isChannelMembersError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="mb-6 h-16 w-16 text-red-500" />
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          Error Loading Channel Access
        </h2>
        <p className="text-muted-foreground">
          There was an error checking your membership for this channel.
        </p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // THE CRITICAL CHECK: If not loading and not a member (for non-DM channels)
  if (!channel.isDm && !isCurrentUserMember && !isLoadingChannelMembers) {
    return <NotAMemberOfChannel channelName={channel?.name ?? "general"} />;
  }
  // If it's a DM and the channelMembersData is loaded but user is not in it (this logic might need refinement for DMs)
  if (
    channel.isDm &&
    !isLoadingChannelMembers &&
    channelMembersData &&
    !isCurrentUserMember
  ) {
    return <NotAMemberOfChannel channelName={channel?.name ?? "general"} />;
  }

  const isMaintainer = projectMembersData?.find(
    (pm) => pm.userId === currentUserId && pm.role === "MAINTAINER",
  );

  const handleOpenEditNameDialog = () => {
    setTimeout(() => setIsEditNameDialogOpen(true), 0);
    setNewChannelName(channel.name ?? "");
  };

  const handleChangeChannelName = async () => {
    if (newChannelName.trim() && channel?.id) {
      updateChannelMutation.mutate(
        { channelId: channel.id, name: newChannelName.trim() },
        {
          onSuccess: () => {
            toast.success("Channel name updated successfully");
            setIsEditNameDialogOpen(false);
            commonMutationOptions.onSuccess();
          },
          onError: (err) => toast.error(`Failed to update: ${err.message}`),
        },
      );
    } else {
      toast.warning("Channel name cannot be empty.");
    }
  };

  const handleRemoveMember = async (projectMemberIdToRemove: string | null) => {
    if (projectMemberIdToRemove === null) return;
    if (channel?.id) {
      updateChannelMutation.mutate(
        { channelId: channel.id, membersToRemove: [projectMemberIdToRemove] },
        {
          onSuccess: () => {
            toast.success("Member removed successfully");
            setIsRemoveMemberDialogOpen(false);
            setMemberToRemove(null);
            commonMutationOptions.onSuccess();
          },
          onError: (err) =>
            toast.error(`Failed to remove member: ${err.message}`),
        },
      );
    }
  };

  const handleDeleteChannel = async () => {
    if (channel?.id) {
      deleteChannelMutation.mutate(
        { channelId: channel.id },
        {
          onError: (err) =>
            toast.error(`Failed to delete channel: ${err.message}`),
        },
        // onSuccess handles navigation and toast
      );
    }
  };

  const availableMembersForAdding = projectMembersData?.filter(
    (pm) => !channelMembersData?.find((cm) => cm.memberId === pm.id),
  );

  const handleAddMembers = async () => {
    if (channel?.id && membersToAdd.length > 0) {
      updateChannelMutation.mutate(
        { channelId: channel.id, membersToAdd: membersToAdd },
        {
          onSuccess: () => {
            toast.success("Members added successfully");
            setIsAddMembersDialogOpen(false);
            setMembersToAdd([]);
            commonMutationOptions.onSuccess();
          },
          onError: (err) =>
            toast.error(`Failed to add members: ${err.message}`),
        },
      );
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-2">
      {/* Top bar with channel name and actions */}
      <div className="flex flex-col">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3 text-lg font-medium text-foreground">
            {channel.isDm ? (
              <Users className="size-5" />
            ) : (
              <Hash className="size-5" />
            )}
            {isMaintainer && !channel.isDm ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="cursor-pointer hover:underline">
                    {channel.name ?? "Unnamed Channel"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Channel Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleOpenEditNameDialog}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Pencil size={16} /> Edit Channel Name
                  </DropdownMenuItem>
                  {!channel.isDm && (
                    <DropdownMenuItem
                      onClick={() =>
                        setTimeout(() => setIsAddMembersDialogOpen(true), 0)
                      }
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <UserPlus size={16} /> Add Members
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setTimeout(() => setIsDeleteDialogOpen(true), 0)
                    }
                    className="flex cursor-pointer items-center gap-2 text-red-600 hover:!text-red-600 focus:bg-red-100 focus:text-red-700 dark:focus:bg-red-900 dark:focus:text-red-300"
                  >
                    <ArchiveXIcon size={16} /> Delete Channel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span>
                {channel.name ?? "Unnamed Channel"}
                {channel.isDm && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (Direct Message)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Right: Member list sheet trigger (only for non-DM channels) */}
          {!channel.isDm && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full max-w-xs sm:max-w-sm"
              >
                <SheetTitle>
                  Members ({channelMembersData?.length ?? 0})
                </SheetTitle>
                <Separator className="my-2" />
                {isLoadingChannelMembers ? (
                  <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <ul className="h-full flex-1 space-y-2">
                    {channelMembersData?.map((cm) => {
                      if (!cm.member?.user) return null; // Should not happen for project channels
                      const memberUser = cm.member.user;
                      const isCurrentUserItem = memberUser.id === currentUserId;
                      return (
                        <li
                          key={cm.id}
                          className="flex items-center justify-between gap-2 py-1"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              {memberUser.image && (
                                <AvatarImage
                                  src={memberUser.image}
                                  alt={memberUser.name ?? undefined}
                                />
                              )}
                              <AvatarFallback>
                                {initials(memberUser.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {memberUser.name}
                            </span>
                          </div>
                          {!isCurrentUserItem && isMaintainer && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setMemberToRemove(cm.member!.id); // cm.memberId is the Project Member ID
                                    setTimeout(
                                      () => setIsRemoveMemberDialogOpen(true),
                                      0,
                                    );
                                  }}
                                  className="text-red-600 hover:!text-red-600 focus:bg-red-100 focus:text-red-700 dark:focus:bg-red-900 dark:focus:text-red-300"
                                >
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
        <Separator />
      </div>

      <div className="flex-grow overflow-y-auto rounded-md p-1 md:p-2">
        {isMessagesLoading ? (
          <MessageListSkeleton
            isDM={channel.isDm} // Pass DM status to skeleton
            channelName={channel.name ?? "Loading..."} // Pass channel name
            count={7} // Or any preferred count
          />
        ) : (
          <MessageList
            messages={messages} // Provide fallback for messagesData
            channel={channel} // channel is guaranteed to exist here by earlier checks
          />
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t p-4 dark:border-neutral-700">
        <ChatInput channelId={channelId!} />
      </div>

      {/* --- Dialogs for Actions --- */}
      {/* Edit Name Dialog */}
      <Dialog
        open={isEditNameDialogOpen}
        onOpenChange={setIsEditNameDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel Name</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="edit-channel-name" className="sr-only">
              New channel name
            </Label>
            <Input
              id="edit-channel-name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder={channel.name ?? "Enter new name"}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditNameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeChannelName}
              disabled={updateChannelMutation.isPending}
            >
              {updateChannelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog (Only for non-DM channels) */}
      {!channel.isDm && (
        <Dialog
          open={isAddMembersDialogOpen}
          onOpenChange={setIsAddMembersDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Add Members to &quot;{channel.name}&quot;
              </DialogTitle>
              <DialogDescription>
                Select project members to add to this channel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid max-h-60 gap-3 overflow-y-auto px-1 py-4">
              {availableMembersForAdding?.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  All project members are already in this channel.
                </p>
              )}
              {availableMembersForAdding?.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                >
                  <input
                    type="checkbox"
                    id={`add-member-${pm.id}`}
                    value={pm.id}
                    checked={membersToAdd.includes(pm.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setMembersToAdd([...membersToAdd, pm.id]);
                      else
                        setMembersToAdd(
                          membersToAdd.filter((id) => id !== pm.id),
                        );
                    }}
                    className="peer h-4 w-4 accent-primary"
                  />
                  <Label
                    htmlFor={`add-member-${pm.id}`}
                    className="flex-grow cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {pm.user.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({pm.role})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddMembersDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={
                  membersToAdd.length === 0 || updateChannelMutation.isPending
                }
              >
                {updateChannelMutation.isPending && membersToAdd.length > 0 && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}{" "}
                Add Selected Members
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Channel Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Channel: &quot;{channel.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the channel and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteChannelMutation.isPending}
            >
              {deleteChannelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Delete Channel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Dialog */}
      <AlertDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from &quot;
              {channel.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRemoveMemberDialogOpen(false);
                setMemberToRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveMember(memberToRemove)}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={updateChannelMutation.isPending}
            >
              {updateChannelMutation.isPending && memberToRemove && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChannelPage;
