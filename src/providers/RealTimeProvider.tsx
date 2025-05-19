"use client";

import { useUserChannelIds } from "@/hooks/useUserChannelIds";
import { useUserDms } from "@/hooks/useUserDms";
import {
  subscribeToChannelChanges,
  unsubscribeFromChannel as unsubscribeFromChannelDetailSubscription,
  type ChannelChangeHandler,
} from "@/lib/events/channel";
import { subscribeToNewDMs } from "@/lib/events/direct-messages";
import {
  type MessagePayload,
  subscribeToActiveMessageChanges,
  subscribeToMessages,
  unsubscribeFromMessageSubscription,
} from "@/lib/events/messages";
import {
  subscribeToUserChannelMembershipChanges,
  unsubscribeFromRealtimeChannel, // Generic unsub for non-message RealtimeChannel
  type UserChannelMembershipChangeHandler,
} from "@/lib/events/userChannelMembershipEvents";
import {
  useActiveChannelId,
  useSetActiveChannelId,
  useSetActiveChannelMessages,
  useSetIsLoadingMessages,
} from "@/providers/ChannelProvider";
import { api } from "@/trpc/react";
import { type RealtimeChannel as SupabaseRealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const RealtimeChannelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = api.auth.getSession.useQuery();
  const userId = session?.user?.id;

  const {
    channelIds: projectChannelIdsFromHook = [],
    channels: projectChannelsFromHook = [], // Used for toast message context
    refetch: refetchUserProjectChannels,
  } = useUserChannelIds(userId);
  const { channels: dmChannelsFromHook = [], refetch: refetchUserDms } =
    useUserDms();

  const activeChannelId = useActiveChannelId();
  const setActiveChannelId = useSetActiveChannelId();
  const setMessages = useSetActiveChannelMessages();
  const setIsLoadingMessages = useSetIsLoadingMessages();

  const notificationChannelSubscriptionsRef = useRef<SupabaseRealtimeChannel[]>(
    [],
  );
  const activeNotificationSubIdsRef = useRef<Set<string>>(new Set()); // Correct ref for active sub IDs

  const activeMessageInsertSubRef = useRef<SupabaseRealtimeChannel | null>(
    null,
  );
  const activeMessageChangesSubRef = useRef<SupabaseRealtimeChannel | null>(
    null,
  );
  const activeChannelDetailsSubRef = useRef<SupabaseRealtimeChannel | null>(
    null,
  );
  const userChannelMembershipSubRef = useRef<SupabaseRealtimeChannel | null>(
    null,
  );

  const utils = api.useContext();

  const { data: currentUserMemberRecords } =
    api.project.getMyProjectMemberRecords.useQuery(undefined, {
      enabled: !!userId,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentUserProjectMemberIds =
    currentUserMemberRecords?.map((member) => member.id) ?? [];

  // EFFECT 1: General Message Notifications (INSERTs only) & New DM subscriptions
  useEffect(() => {
    if (!userId) {
      Promise.allSettled(
        notificationChannelSubscriptionsRef.current.map((channelSub) =>
          unsubscribeFromMessageSubscription(channelSub),
        ),
      ).catch(console.error);
      notificationChannelSubscriptionsRef.current = []; // Clear the array of subs
      activeNotificationSubIdsRef.current.clear(); // Clear the set of active IDs
      return;
    }

    const allUserAccessibleChannelIds = [
      ...projectChannelIdsFromHook,
      ...(dmChannelsFromHook?.map((dm) => dm.id) || []),
    ];

    // Get current state of refs
    const currentSubscriptionObjectsArray =
      notificationChannelSubscriptionsRef.current;

    const subscriptionsToKeepArray: SupabaseRealtimeChannel[] = [];
    const idsToKeepInSet = new Set<string>();

    currentSubscriptionObjectsArray.forEach((sub) => {
      const topicChannelId = sub.topic.replace("messages:insert:notify:", "");
      if (allUserAccessibleChannelIds.includes(topicChannelId)) {
        subscriptionsToKeepArray.push(sub);
        idsToKeepInSet.add(topicChannelId);
      } else {
        unsubscribeFromMessageSubscription(sub).catch(console.error);
        // No need to delete from currentActiveIdsSet here, as we rebuild it with idsToKeepInSet
      }
    });

    notificationChannelSubscriptionsRef.current = subscriptionsToKeepArray;
    activeNotificationSubIdsRef.current = idsToKeepInSet;

    // Subscribe to new channels
    allUserAccessibleChannelIds.forEach((channelId) => {
      if (!activeNotificationSubIdsRef.current.has(channelId)) {
        // Check the correct Set
        console.log(
          "📡 [Notify] Subscribing to new messages for channel:",
          channelId,
        );
        const sub = subscribeToMessages(
          channelId,
          (newMessage: MessagePayload) => {
            console.log(
              "📡 [Notify] New message received for channel " + channelId + ":",
              newMessage,
            );

            if (
              newMessage.senderId !== userId &&
              channelId !== activeChannelId
            ) {
              const projectChannel = projectChannelsFromHook.find(
                (pc) => pc.channel.id === channelId,
              );
              const dmChannel = dmChannelsFromHook.find(
                (dc) => dc.id === channelId,
              ); // dmChannel.name is the OTHER user's name

              let title = ""; // For toast title (e.g., "New message from X" or "New message in Y")
              let body = ""; // For toast body (the message content or attachment info)

              const hasContent =
                newMessage.content && newMessage.content.trim() !== "";
              const attachmentCount = newMessage.attachments?.length;

              if (dmChannel) {
                // It's a DM
                const senderDisplayNameForDm = dmChannel.name ?? "Someone";
                title = `New message from ${senderDisplayNameForDm}`;

                if (hasContent) {
                  body = newMessage.content.substring(0, 50);
                  if (newMessage.content.length > 50) body += "...";

                  if (attachmentCount === 1) {
                    body += ` (and 1 attachment)`;
                  } else if (attachmentCount > 1) {
                    body += ` (and ${attachmentCount} attachments)`;
                  }
                } else {
                  // No text content, only attachment(s)
                  if (attachmentCount === 1) {
                    const attachmentName =
                      newMessage.attachments[0]?.fileName ?? "a file";
                    body = `Sent an attachment: ${attachmentName.substring(0, 30)}${attachmentName.length > 30 ? "..." : ""}`;
                  } else if (attachmentCount > 1) {
                    body = `Sent ${attachmentCount} attachments`;
                  } else {
                    // Should not happen if our send logic requires content or attachment
                    body = "Sent an empty message.";
                  }
                }
              } else {
                // It's a project channel
                const channelNameForToast = projectChannel?.channel?.name
                  ? "# " + projectChannel.channel.name
                  : "a channel";
                title = `New message in ${channelNameForToast}:`;

                if (hasContent) {
                  body = newMessage.content.substring(0, 50);
                  if (newMessage.content.length > 50) body += "...";

                  if (attachmentCount === 1) {
                    body += ` (with 1 attachment)`;
                  } else if (attachmentCount > 1) {
                    body += ` (with ${attachmentCount} attachments)`;
                  }
                } else {
                  // No text content, only attachment(s)
                  if (attachmentCount === 1) {
                    const attachmentName =
                      newMessage.attachments[0]?.fileName ?? "an attachment";
                    body = `Shared an attachment: ${attachmentName.substring(0, 30)}${attachmentName.length > 30 ? "..." : ""}`;
                  } else if (attachmentCount > 1) {
                    body = `Shared ${attachmentCount} attachments`;
                  } else {
                    // Should not happen
                    body = "Shared an empty message.";
                  }
                }
              }

              // Using sonner's toast with title and description
              toast.info(title, {
                description: body,
                duration: 8000,
                // action: {
                //   label: "View",
                //   onClick: () => {
                //     console.log("pushing");
                //     if (dmChannel)
                //       router.push(
                //         `/dashboard/${projectChannel?.channel.projectId}/direct-message/${channelId}`,
                //       );
                //     else if (projectChannel)
                //       router.push(
                //         `/dashboard/${projectChannel.channel.projectId}/channel/${channelId}`,
                //       );
                //   },
                // },
              });
            }
          },
          "notification",
        );
        notificationChannelSubscriptionsRef.current.push(sub);
        activeNotificationSubIdsRef.current.add(channelId); // Add to the correct Set
      }
    });

    const newDmDetectorSub = subscribeToNewDMs(userId, (newDmChannelId) => {
      console.log("🚀 New DM detected by global listener:", newDmChannelId);
      refetchUserDms().catch(console.error);
    });

    return () => {
      if (
        newDmDetectorSub &&
        typeof newDmDetectorSub.unsubscribe === "function"
      ) {
        // Assuming newDmDetectorSub is a RealtimeChannel or has an unsubscribe method
        // If it's from subscribeToNewDMs and that function returns a cleanup itself,
        // this might need adjustment or might be handled by the function's own internal cleanup.
        // For this example, if it's a SupabaseRealtimeChannel:
        unsubscribeFromMessageSubscription(newDmDetectorSub).catch(
          console.error,
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    projectChannelIdsFromHook,
    dmChannelsFromHook,
    activeChannelId,
    utils, // utils is stable from api.useContext()
    refetchUserDms,
    projectChannelsFromHook, // Added as it's used for toast messages
  ]);

  // EFFECT 2: Real-time message updates (INSERT, UPDATE, DELETE) for the *actively viewed* channel
  // Inside RealtimeChannelProvider.tsx

  // EFFECT 2: Real-time message updates (INSERT, UPDATE, DELETE) for the *actively viewed* channel
  useEffect(() => {
    if (!activeChannelId || typeof activeChannelId !== "string") {
      void unsubscribeFromMessageSubscription(
        activeMessageInsertSubRef.current,
      );
      activeMessageInsertSubRef.current = null;
      void unsubscribeFromMessageSubscription(
        activeMessageChangesSubRef.current,
      );
      activeMessageChangesSubRef.current = null;
      return;
    }

    let isMounted = true;
    setMessages({ messages: [], nextOffset: 0, hasMore: true });
    utils.client.chat.getMessages
      .query({ channelId: activeChannelId, limit: 20, offset: 0 })
      .then((initialMessagesData) => {
        if (!isMounted) return;
        // Assuming initialMessagesData.messages ARE of the enriched type (with sender, attachments)
        setMessages({
          messages: initialMessagesData.messages.slice().reverse(),
          nextOffset: initialMessagesData.nextOffset,
          hasMore: initialMessagesData.hasMore,
        });
        setIsLoadingMessages(false); // Set loading to false after fetching initial messages
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(
          "❌ Failed to load initial messages for active channel:",
          err,
        );
        setMessages((prev) => ({ ...prev, isLoading: false, hasMore: false }));
      });

    void unsubscribeFromMessageSubscription(activeMessageInsertSubRef.current);
    void unsubscribeFromMessageSubscription(activeMessageChangesSubRef.current);

    // Subscribe to INSERTS
    const insertSub = subscribeToMessages(
      activeChannelId,
      (rawNewMessage: MessagePayload) => {
        // rawNewMessage is Prisma's Message type
        if (!isMounted) return;

        // Fetch the full, enriched message object that includes sender and attachments
        utils.client.chat.getMessage
          .query({ messageId: rawNewMessage.id })
          .then((enrichedNewMessage) => {
            if (!isMounted || !enrichedNewMessage) {
              console.warn(
                "Failed to fetch enriched details for new message or unmounted:",
                rawNewMessage.id,
              );
              // Optionally, you could add the rawNewMessage with default/empty sender/attachments
              // if your UI can handle that, but it's better to have consistent types.
              return;
            }

            // Now enrichedNewMessage should match the type expected by setMessages
            setMessages((prev) => {
              if (prev.messages.find((m) => m.id === enrichedNewMessage.id))
                return prev;
              return {
                ...prev,
                messages: [...prev.messages, enrichedNewMessage], // Add the enriched message
              };
            });
            console.log(
              "📩 [Active] New (enriched) message in active channel:",
              enrichedNewMessage,
            );
          })
          .catch((err) => {
            console.error(
              "❌ Error fetching enriched details for new message:",
              err,
              rawNewMessage,
            );
            // Handle error: maybe show a placeholder, or even add the raw message if absolutely necessary
            // For consistency, it's often better to not add it if enrichment fails, or retry.
          });
      },
      "active",
    );
    activeMessageInsertSubRef.current = insertSub;

    // Subscribe to UPDATES and DELETES
    const changesSub = subscribeToActiveMessageChanges(
      activeChannelId,
      (event) => {
        // event.data will be Prisma's Message for UPDATE, Partial<Message> for DELETE
        if (!isMounted) return;

        if (event.type === "UPDATE") {
          // For UPDATE, event.data is the updated Prisma Message.
          // We need to fetch the enriched version again.
          utils.client.chat.getMessage
            .query({ messageId: event.data.id })
            .then((enrichedUpdatedMessage) => {
              if (!isMounted || !enrichedUpdatedMessage) {
                console.warn(
                  "Failed to fetch enriched details for updated message or unmounted:",
                  event.data.id,
                );
                return;
              }
              setMessages((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === enrichedUpdatedMessage.id
                    ? enrichedUpdatedMessage
                    : msg,
                ),
              }));
              console.log(
                "🔄 [Active] Message updated (enriched) in active channel:",
                enrichedUpdatedMessage,
              );
            })
            .catch((err) => {
              console.error(
                "❌ Error fetching enriched details for updated message:",
                err,
                event.data,
              );
            });
        } else if (event.type === "DELETE") {
          // event.id is the ID of the deleted message
          setMessages((prev) => ({
            ...prev,
            messages: prev.messages.filter((msg) => msg.id !== event.id),
          }));
          console.log(
            "🗑️ [Active] Message deleted in active channel, ID:",
            event.id,
          );
        }
      },
    );
    activeMessageChangesSubRef.current = changesSub;

    return () => {
      isMounted = false;
      void unsubscribeFromMessageSubscription(
        activeMessageInsertSubRef.current,
      );
      activeMessageInsertSubRef.current = null;
      void unsubscribeFromMessageSubscription(
        activeMessageChangesSubRef.current,
      );
      activeMessageChangesSubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeChannelId,
    setMessages,
    utils.client.chat.getMessage,
    utils.client.chat.getMessages,
  ]); // Added getMessages dependency

  // EFFECT 3: Subscribe to changes for the *active* channel's details
  useEffect(() => {
    if (!activeChannelId || typeof activeChannelId !== "string" || !userId) {
      if (activeChannelDetailsSubRef.current) {
        unsubscribeFromChannelDetailSubscription(
          activeChannelDetailsSubRef.current,
        ).catch(console.error);
        activeChannelDetailsSubRef.current = null;
      }
      return;
    }
    const handleChannelEvent: ChannelChangeHandler = (change) => {
      if (change.data.projectId) {
        utils.chat.getChannels
          .invalidate({ projectId: change.data.projectId })
          .catch(console.error);
        utils.chat.getAllUserChannelIds
          .invalidate({ userId })
          .catch(console.error);
      }
      if (change.data.isDm) {
        utils.chat.getDmChannels.invalidate({ userId }).catch(console.error);
      }
      // Use string literals for event type comparison
      if (change.event === "UPDATE") {
        toast.info(`Channel "${change.data.name ?? "Details"}" updated.`);
        utils.chat.getChannelMembers
          .invalidate({ channelId: activeChannelId })
          .catch(console.error);
      } else if (change.event === "DELETE") {
        toast.warning(
          `Channel "${change.data.name ?? "This channel"}" has been deleted.`,
        );
        if (activeChannelId === change.channelId) setActiveChannelId(null);
      }
    };
    if (activeChannelDetailsSubRef.current) {
      unsubscribeFromChannelDetailSubscription(
        activeChannelDetailsSubRef.current,
      ).catch(console.error);
    }
    const sub = subscribeToChannelChanges(activeChannelId, handleChannelEvent);
    activeChannelDetailsSubRef.current = sub;
    return () => {
      if (activeChannelDetailsSubRef.current) {
        unsubscribeFromChannelDetailSubscription(
          activeChannelDetailsSubRef.current,
        ).catch(console.error);
        activeChannelDetailsSubRef.current = null;
      }
    };
  }, [activeChannelId, userId, utils, setActiveChannelId]);

  // EFFECT 4: Subscribe to user's own channel membership changes
  useEffect(() => {
    if (!userId || !currentUserMemberRecords) {
      if (userChannelMembershipSubRef.current) {
        unsubscribeFromRealtimeChannel(
          userChannelMembershipSubRef.current,
        ).catch(console.error);
        userChannelMembershipSubRef.current = null;
      }
      return;
    }
    const handleUserMembershipChange: UserChannelMembershipChangeHandler = (
      change,
    ) => {
      const channelName =
        change.channelMember.channel?.name ?? `ID: ${change.channelId}`;
      if (change.type === "ADDED_TO_CHANNEL") {
        toast.success(`You've been added to channel: ${channelName}`);
        refetchUserProjectChannels().catch(console.error);
        if (
          change.channelMember.channel?.isDm ||
          change.channelMember.userId === userId
        ) {
          refetchUserDms().catch(console.error);
        }
      } else if (change.type === "REMOVED_FROM_CHANNEL") {
        toast.warning(`You've been removed from channel: ${channelName}`);
        refetchUserProjectChannels().catch(console.error);
        if (
          change.channelMember.channel?.isDm ||
          change.channelMember.userId === userId
        ) {
          refetchUserDms().catch(console.error);
        }
        if (activeChannelId === change.channelId) setActiveChannelId(null);
      }
      utils.chat.getAllUserChannelIds
        .invalidate({ userId })
        .catch(console.error);
      if (change.channelMember.channel?.projectId) {
        utils.chat.getChannels
          .invalidate({ projectId: change.channelMember.channel.projectId })
          .catch(console.error);
      }
    };
    if (userChannelMembershipSubRef.current) {
      unsubscribeFromRealtimeChannel(userChannelMembershipSubRef.current).catch(
        console.error,
      );
    }
    const sub = subscribeToUserChannelMembershipChanges(
      userId,
      currentUserProjectMemberIds,
      handleUserMembershipChange,
    );
    userChannelMembershipSubRef.current = sub;
    return () => {
      unsubscribeFromRealtimeChannel(userChannelMembershipSubRef.current).catch(
        console.error,
      );
      userChannelMembershipSubRef.current = null;
    };
  }, [
    userId,
    currentUserProjectMemberIds,
    utils,
    activeChannelId,
    setActiveChannelId,
    currentUserMemberRecords,
    refetchUserProjectChannels,
    refetchUserDms,
  ]);

  return <>{children}</>;
};
