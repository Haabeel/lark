"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import ChatInput from "@/components/dashboard/channel/ChatInput"; // Reusable
import MessageList from "@/components/dashboard/channel/MessageList"; // Reusable
import MessageListSkeleton from "@/components/dashboard/channel/MessagesSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUserDms } from "@/hooks/useUserDms"; // Your hook to get DM details
import { initials } from "@/lib/utils";
import {
  useActiveChannelMessages,
  useIsLoadingMessages,
  useSetActiveChannelId, // From ChannelProvider, to set context for messages
} from "@/providers/ChannelProvider";
import { useDashboard } from "@/providers/DashboardProvider"; // To get current user

// Helper for loading/error screens
const LoadingScreen = () => (
  <div className="flex h-full items-center justify-center text-muted-foreground">
    <MessageListSkeleton />
  </div>
);

const ErrorScreen = ({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack?: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
    <ShieldAlert className="mb-6 h-16 w-16 text-destructive" />
    <h2 className="mb-3 text-2xl font-semibold text-foreground">{title}</h2>
    <p className="text-muted-foreground">{message}</p>
    {onBack && (
      <Button variant="outline" className="mt-8" onClick={onBack}>
        Go Back
      </Button>
    )}
  </div>
);

const DirectMessagePage = () => {
  // ===== ALL HOOKS AT THE TOP =====
  const params = useParams<{ channelId?: string }>();
  const channelId = params.channelId; // Extracted for clarity
  const router = useRouter();

  const dashboard = useDashboard();
  const currentUserId = dashboard?.user?.id;

  // Fetch all DMs for the user using your hook to find details of THIS DM
  const {
    channels: userDmsList,
    isLoading: isLoadingUserDms,
    isError: isUserDmsError,
  } = useUserDms(); // This hook already uses api.chat.getUserDms.useQuery()

  const setActiveChannelId = useSetActiveChannelId();
  const messages = useActiveChannelMessages(); // From ChannelProvider
  const isLoadingMessages = useIsLoadingMessages();

  // Find the specific DM channel object from the list of user's DMs
  const currentDmChannel = useMemo(() => {
    if (!channelId || !userDmsList || userDmsList.length === 0) return null;
    return userDmsList.find((dm) => dm.id === channelId) ?? null;
  }, [channelId, userDmsList]);

  // Determine the other user in the DM
  const otherUser = useMemo(() => {
    if (!currentDmChannel || !currentUserId) return null;
    // The `getUserDms` route already processed and added `otherUser` info
    // so we can directly use it if it's part of the DMChannel type.
    // If not, we'd find them from `currentDmChannel.members`.
    // Assuming your DMChannel type from useUserDms includes this:
    if (currentDmChannel.otherUserId && currentDmChannel.name) {
      return {
        id: currentDmChannel.otherUserId,
        name: currentDmChannel.name, // Name is usually the other user's name
        image: currentDmChannel.otherUserImage,
      };
    }
    // Fallback if `otherUserId` etc. are not directly on `DMChannel` type
    // (This part might be redundant if your `getUserDms` already prepares otherUser info well)
    const otherMemberEntry = currentDmChannel.members?.find(
      (member) => member.user?.id !== currentUserId,
    );
    return otherMemberEntry?.user ?? null;
  }, [currentDmChannel, currentUserId]);

  // ---- EFFECTS (after all hooks and derived state) ----
  useEffect(() => {
    // Set the active channel ID in the ChannelProvider for message fetching
    if (channelId && currentDmChannel && currentUserId) {
      // Basic check: ensure current user is part of this DM based on fetched DM list
      const isMember = currentDmChannel.members?.some(
        (m) => m.userId === currentUserId,
      );
      if (isMember) {
        setActiveChannelId(channelId);
      } else {
        // User is not a member of this DM channel (edge case, shouldn't happen if list is correct)
        console.warn("User is not a member of this DM channel:", channelId);
        // Optionally navigate away or show an error
      }
    }
  }, [channelId, currentDmChannel, setActiveChannelId, currentUserId]);

  // ---- CONDITIONAL RENDERING (after all hooks & derived state) ----
  if (!dashboard || !currentUserId) {
    return <LoadingScreen />;
  }
  if (isLoadingUserDms) {
    return <LoadingScreen />;
  }

  if (isUserDmsError || !channelId) {
    return (
      <ErrorScreen
        title="Error Loading DM"
        message="Could not load direct message information."
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  // If the specific DM channel is not found in the user's DM list
  if (!currentDmChannel) {
    return (
      <ErrorScreen
        title="Direct Message Not Found"
        message="This direct message does not exist or you don't have access."
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  // Ensure the current user is actually a participant of this DM based on fetched data
  // (This is a sanity check; `getUserDms` should only return DMs user is part of)
  const isParticipant = currentDmChannel.members?.some(
    (m) => m.userId === currentUserId,
  );
  if (!isParticipant && !isLoadingUserDms) {
    // Check after DMs have loaded
    return (
      <ErrorScreen
        title="Access Denied"
        message="You are not a participant in this direct message."
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  // ---- If DM is found and user is a participant, render DM content ----
  return (
    <div className="flex h-full flex-col justify-between gap-2">
      {/* Top bar with other user's info */}
      <div className="flex flex-col">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 md:hidden"
              onClick={() => router.back()}
            >
              {" "}
              {/* Back button for mobile */}
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {otherUser ? (
              <>
                <Avatar className="h-8 w-8">
                  {otherUser.image && (
                    <AvatarImage
                      src={otherUser.image}
                      alt={otherUser.name ?? undefined}
                    />
                  )}
                  <AvatarFallback>{initials(otherUser.name)}</AvatarFallback>
                </Avatar>
                <span className="text-lg font-medium text-foreground">
                  {otherUser.name ?? "Direct Message"}
                </span>
              </>
            ) : (
              <span className="text-lg font-medium text-foreground">
                Direct Message
              </span>
            )}
          </div>
          {/* Placeholder for any DM-specific actions, if any (e.g., view profile, block) */}
          <div></div>
        </div>
        <Separator />
      </div>

      <div className="flex-grow overflow-y-auto rounded-md p-1 md:p-2">
        {isLoadingMessages ? (
          <MessageListSkeleton
            isDM={false} // Pass DM status to skeleton
            channelName={currentDmChannel.name} // Pass channel name
            count={7} // Or any preferred count
          />
        ) : (
          <MessageList
            messages={messages} // Provide fallback for messagesData
            channel={currentDmChannel} // channel is guaranteed to exist here by earlier checks
          />
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t p-4 dark:border-neutral-700">
        {/* Pass the actual DM channel ID */}
        <ChatInput channelId={currentDmChannel.id} />
      </div>
    </div>
  );
};

export default DirectMessagePage;
