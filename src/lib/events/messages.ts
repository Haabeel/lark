import { supabase } from "@/lib/supabaseClient";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload, // Using the more generic payload type
} from "@supabase/supabase-js";
import type { Attachment, Message } from "@prisma/client"; // Prisma Message type

export type MessagePayload = Message & {
  attachments: Attachment[];
};
// --- Types for general message events (can still be used for INSERTs) ---
export type MessageInsertEventHandler = (event: MessagePayload) => void;

// --- Types specific to active channel changes (UPDATE/DELETE) ---
export type ActiveMessageChangeEvent =
  | { type: "UPDATE"; id: string; channelId: string; data: MessagePayload } // payload.new
  | {
      type: "DELETE";
      id: string;
      channelId: string;
      data: Partial<MessagePayload>;
    }; // payload.old

export type ActiveMessageChangeEventHandler = (
  event: ActiveMessageChangeEvent,
) => void;

/**
 * Original function, potentially simplified to only handle INSERTs
 * or specific contexts. For this example, let's keep its existing signature
 * but note it might be primarily for INSERTs now.
 */

export const subscribeToMessages = (
  channelId: string,
  onMessageInsert: MessageInsertEventHandler, // Changed to be specific for INSERTs
  context: "notification" | "active" = "notification", // Context might be less relevant if only for INSERT
): RealtimeChannel => {
  const uniqueChannelName =
    context === "notification"
      ? `messages:insert:notify:${channelId}` // More specific channel name
      : `messages:insert:active:${channelId}`;

  console.log(
    `[MsgSub:Insert] Subscribing to INSERT on ${uniqueChannelName} for channelId: ${channelId}`,
  );

  const channel = supabase.channel(uniqueChannelName);

  channel
    .on<MessagePayload>(
      "postgres_changes",
      {
        event: "INSERT", // Specifically listen only to INSERT
        schema: "public",
        table: "message",
        filter: `channelId=eq.${channelId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        console.log(
          `[MsgSub:Insert] Supabase payload for ${uniqueChannelName}:`,
          payload,
        );
        if (payload.eventType === "INSERT") {
          onMessageInsert(payload.new); // Call the handler with the new message
        }
      },
    )
    .subscribe();

  return channel;
};

/**
 * NEW function to subscribe to UPDATE and DELETE events for an active channel.
 */
export const subscribeToActiveMessageChanges = (
  channelId: string,
  onMessageChangeEvent: ActiveMessageChangeEventHandler,
): RealtimeChannel => {
  // Use a distinct channel name from the INSERT listener to avoid conflicts if both are active.
  const uniqueChannelName = `messages:active-changes:${channelId}`;

  console.log(
    `[MsgSub:ActiveChanges] Subscribing to UPDATE/DELETE on ${uniqueChannelName} for channelId: ${channelId}`,
  );

  const channel = supabase.channel(uniqueChannelName);

  channel
    .on<MessagePayload>( // Provide the table type <Message> to .on()
      "postgres_changes",
      {
        event: "*", // Listen to all (INSERT, UPDATE, DELETE) for this specific channel
        schema: "public",
        table: "message",
        filter: `channelId=eq.${channelId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        // Explicitly type payload
        console.log(
          `[MsgSub:ActiveChanges] Supabase payload for ${uniqueChannelName}:`,
          payload,
        );

        switch (payload.eventType) {
          case "UPDATE":
            onMessageChangeEvent({
              type: "UPDATE",
              id: payload.new.id,
              channelId: payload.new.channelId,
              data: payload.new,
            });
            break;
          case "DELETE":
            // REPLICA IDENTITY FULL on 'message' table is needed for payload.old to contain all columns.
            if (
              payload.old &&
              "id" in payload.old &&
              "channelId" in payload.old
            ) {
              onMessageChangeEvent({
                type: "DELETE",
                id: payload.old.id!, // ID of the deleted message
                channelId: payload.old.channelId!, // Channel ID from the deleted message
                data: payload.old, // The old data of the message
              });
            } else {
              console.warn(
                "[MsgSub:ActiveChanges] Received DELETE event without sufficient 'old' data:",
                payload,
              );
            }
            break;
          case "INSERT":
            // This subscription is for UPDATE/DELETE, so we typically ignore INSERTs here
            // if another subscription (like subscribeToMessages) handles them.
            // console.log(`[MsgSub:ActiveChanges] Ignoring INSERT for ${uniqueChannelName}, handled by other sub.`);
            break;
          default:
            console.warn(
              `[MsgSub:ActiveChanges] Received unhandled event type`,
            );
        }
      },
    )
    .subscribe();

  return channel;
};

// Generic unsubscribe function that can be used for both types of subscriptions
export const unsubscribeFromMessageSubscription = async (
  channel: RealtimeChannel | null, // Allow null for safety
) => {
  if (channel) {
    try {
      const topic = channel.topic; // Get topic before potential removal
      const status = await channel.unsubscribe();
      console.log(`[MsgSub] Unsubscribed from ${topic}, status: ${status}`);
      // Optionally, if you want to completely remove the client-side channel instance:
      // await supabase.removeChannel(channel);
      // console.log(`[MsgSub] Removed channel instance for ${topic}`);
    } catch (error) {
      console.error(`[MsgSub] Error unsubscribing from channel:`, error);
    }
  }
};
