// Path: src/lib/events/userChannelMembershipEvents.ts

import { supabase } from "@/lib/supabaseClient"; // Adjust path to your Supabase client
import type { Channel, ChannelMember, Project } from "@prisma/client"; // Assuming you use Prisma and have these types
import {
  type RealtimeChannel as SupabaseRealtimeChannel, // Alias to avoid confusion if you have your own RealtimeChannel type
  type RealtimePostgresInsertPayload,
  type RealtimePostgresDeletePayload,
  type RealtimePostgresUpdatePayload,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";

// Enriched ChannelMember type that might come from the payload if relations are included
// This is more of a conceptual type for what payload.new or payload.old might contain
// if Supabase sends related data (often it doesn't for simple changes without specific view/function subscriptions)
// For safety, it's better to rely on the IDs and refetch full data if needed.
type EnrichedChannelMember = ChannelMember & {
  channel?: Partial<Channel>; // Channel data might be partial or not present
  member?: { project?: Partial<Project> }; // Nested project data
};

// Custom event types to clearly distinguish between being added or removed
export type UserChannelMembershipCustomEvent =
  | {
      type: "ADDED_TO_CHANNEL";
      channelId: string;
      /** The ChannelMember record that was created.
       *  Note: Relational data like 'channel' or 'member.project' might not be fully populated
       *  directly from the Supabase payload unless your subscription is very specific or on a view.
       *  Rely primarily on IDs and refetch if full related objects are needed.
       */
      channelMember: EnrichedChannelMember;
    }
  | {
      type: "REMOVED_FROM_CHANNEL";
      channelId: string;
      /** The ChannelMember record that was deleted (from payload.old).
       *  Requires REPLICA IDENTITY FULL on the ChannelMember table.
       *  Relational data constraints apply as above.
       */
      channelMember: EnrichedChannelMember;
    };

// Type for the callback function that will handle these custom events
export type UserChannelMembershipChangeHandler = (
  change: UserChannelMembershipCustomEvent,
) => void;

/**
 * Subscribes to changes in channel membership for a specific user.
 * Triggers the onChange callback when the specified user is added to or removed from a channel,
 * either directly via their userId or through one of their project memberships.
 *
 * @param currentUserId - The ID of the user whose membership changes to monitor.
 * @param currentUserProjectMemberIds - An array of `Member.id` strings that belong to the currentUserId.
 *                                      This is used to detect membership changes via project roles.
 * @param onChange - Callback function to handle the membership change event.
 * @returns The Supabase RealtimeChannel for later unsubscribing.
 */
export function subscribeToUserChannelMembershipChanges(
  currentUserId: string,
  currentUserProjectMemberIds: string[],
  onChange: UserChannelMembershipChangeHandler,
): SupabaseRealtimeChannel {
  const uniqueSubscriptionName = `user-channel-membership-${currentUserId}`;

  const realtimeChannel = supabase
    .channel(uniqueSubscriptionName)
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, DELETE on the table
        schema: "public",
        table: "channel_member",
        // No specific filter here; filtering logic is in the callback due to complexity
        // (user is member if ChannelMember.userId = currentUserId OR ChannelMember.memberId IN currentUserProjectMemberIds)
      },
      (
        payload:
          | RealtimePostgresInsertPayload<ChannelMember> // Prisma's ChannelMember type
          | RealtimePostgresDeletePayload<ChannelMember>
          | RealtimePostgresUpdatePayload<ChannelMember>,
      ) => {
        if (payload.eventType === "INSERT") {
          const newRecord = payload.new as EnrichedChannelMember; // Cast for potential (but often not present) related data
          // Check if the new ChannelMember record involves the current user
          if (
            newRecord.userId === currentUserId ||
            (newRecord.memberId &&
              currentUserProjectMemberIds.includes(newRecord.memberId))
          ) {
            console.log(
              `[Realtime] User ${currentUserId} ADDED to channel ${newRecord.channelId}`,
              newRecord,
            );
            onChange({
              type: "ADDED_TO_CHANNEL",
              channelId: newRecord.channelId,
              channelMember: newRecord, // Pass the record from the payload
            });
          }
        } else if (payload.eventType === "DELETE") {
          const oldRecord = payload.old as EnrichedChannelMember; // Cast for potential related data

          // For DELETE, payload.old needs to contain enough data.
          // This requires the 'ChannelMember' table to have REPLICA IDENTITY FULL.
          // oldRecord.id is usually the primary key and should be present if replica identity is at least DEFAULT.
          // We need userId, memberId, and channelId from oldRecord.
          if (
            oldRecord &&
            (oldRecord.userId || oldRecord.memberId) &&
            oldRecord.channelId
          ) {
            if (
              oldRecord.userId === currentUserId ||
              (oldRecord.memberId &&
                currentUserProjectMemberIds.includes(oldRecord.memberId))
            ) {
              console.log(
                `[Realtime] User ${currentUserId} REMOVED from channel ${oldRecord.channelId}`,
                oldRecord,
              );
              onChange({
                type: "REMOVED_FROM_CHANNEL",
                channelId: oldRecord.channelId,
                channelMember: oldRecord, // Pass the old record from the payload
              });
            }
          } else {
            console.warn(
              `[Realtime] Received DELETE on ChannelMember without sufficient 'old' record data for user ${currentUserId}. Check table's REPLICA IDENTITY or payload content. Payload.old:`,
              payload.old,
            );
          }
        }
        // Note: UPDATE events on ChannelMember are not explicitly handled as "add" or "remove" here.
        // If an UPDATE changes userId or memberId to match/unmatch, it's a complex case
        // that might require more sophisticated logic or separate event types.
        // This setup focuses on rows being created or deleted involving the user.
      },
    )
    .subscribe((status: REALTIME_SUBSCRIBE_STATES, err) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        console.log(
          `[Realtime] Subscribed to ChannelMember changes for user ${currentUserId} on channel ${uniqueSubscriptionName}`,
        );
      } else if (
        status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
        status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
      ) {
        console.error(
          `[Realtime] Error subscribing to ChannelMember for user ${currentUserId} on ${uniqueSubscriptionName}:`,
          status,
          err, // err might be present on CHANNEL_ERROR
        );
      } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
        console.log(
          `[Realtime] Channel ${uniqueSubscriptionName} for user ${currentUserId} was closed.`,
        );
      }
    });

  return realtimeChannel;
}

/**
 * Unsubscribes from a given Supabase RealtimeChannel.
 * @param channel - The RealtimeChannel to unsubscribe from.
 */
export async function unsubscribeFromRealtimeChannel(
  channel: SupabaseRealtimeChannel | null,
) {
  if (channel) {
    try {
      const status = await channel.unsubscribe();
      console.log(
        `[Realtime] Unsubscribed from channel ${channel.topic}, status: ${status}`,
      );
    } catch (error) {
      console.error(
        `[Realtime] Error unsubscribing from channel ${channel.topic}:`,
        error,
      );
    }
  }
}
