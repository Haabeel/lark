// src/lib/events/direct-messages.ts

import { supabase } from "@/lib/supabaseClient";
import {
  type RealtimeChannel as SupabaseRealtimeChannel,
  type RealtimePostgresChangesPayload,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";
// Assuming your Prisma client exports these types, adjust if necessary
import type {
  Channel as PrismaChannel,
  ChannelMember as PrismaChannelMember,
} from "@prisma/client";

// Type for the callback when a new DM is detected.
// It passes the ID of the newly relevant DM channel.
export type NewDmDetectedHandler = (newDmChannelId: string) => void;

/**
 * Subscribes to events that indicate a new Direct Message channel
 * has become relevant to the current user.
 *
 * This example listens to INSERTS on the `ChannelMember` table.
 * When a new ChannelMember record is created linking the `currentUserId`
 * to a Channel that is a DM (isDm: true, projectId: null), the handler is called.
 *
 * @param currentUserId The ID of the user for whom to detect new DMs.
 * @param onNewDm Callback function triggered with the new DM channel's ID.
 * @returns A SupabaseRealtimeChannel instance for the subscription, or null if subscription fails.
 */
export function subscribeToNewDMs(
  currentUserId: string,
  onNewDm: NewDmDetectedHandler,
): SupabaseRealtimeChannel | null {
  if (!currentUserId) {
    console.error(
      "[NewDMDetector] currentUserId is required to subscribe to new DMs.",
    );
    return null;
  }

  const uniqueListenerName = `new-dm-detector-for-${currentUserId}`;

  try {
    const channel = supabase
      .channel(uniqueListenerName)
      .on<PrismaChannelMember>( // Specify the Prisma type for the table being listened to
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_member", // Listening for new memberships
          filter: `userId=eq.${currentUserId}`, // This is a placeholder; adjust as needed
          // and that's what we're interested in.
          // However, the logic below checks this and then fetches the channel details.
          // If ChannelMember directly has userId, a filter here would be more efficient:
          // filter: `userId=eq.${currentUserId}`, // Example if userId is a direct column
        },
        (payload: RealtimePostgresChangesPayload<PrismaChannelMember>) => {
          // Outer callback is SYNCHRONOUS
          console.log(
            `[NewDMDetector] Received payload for ${uniqueListenerName}:`,
            payload,
          );
          if (payload.eventType === "INSERT") {
            const newMemberRecord = payload.new;

            // Check if the new membership involves the current user
            // and has a channelId to investigate.
            // This assumes `newMemberRecord.userId` is the direct link for a DM participant.
            if (
              newMemberRecord.userId === currentUserId &&
              newMemberRecord.channelId
            ) {
              const dmChannelIdToCheck = newMemberRecord.channelId;

              // Use a self-invoking async function (IIFE) for the async database call
              void (async () => {
                try {
                  console.log(
                    `[NewDMDetector] Checking channel details for ID: ${dmChannelIdToCheck}`,
                  );
                  const { data: associatedChannelData, error: fetchError } =
                    await supabase
                      .from("channel") // Ensure 'Channel' is the exact table name in your DB
                      .select("id, isDm, projectId") // Select only necessary fields
                      .eq("id", dmChannelIdToCheck)
                      .maybeSingle(); // Expect 0 or 1 row

                  if (fetchError) {
                    console.error(
                      `[NewDMDetector] Error fetching channel details for ${dmChannelIdToCheck}:`,
                      fetchError.message,
                    );
                    return;
                  }

                  // Check if the fetched channel is indeed a DM (isDm: true and projectId: null)
                  if (
                    associatedChannelData?.isDm &&
                    associatedChannelData.projectId === null
                  ) {
                    console.log(
                      `[NewDMDetector] Confirmed new DM membership for user ${currentUserId} in channel ${dmChannelIdToCheck}`,
                    );
                    onNewDm(dmChannelIdToCheck); // Call the provided handler
                  } else {
                    // console.log(`[NewDMDetector] Channel ${dmChannelIdToCheck} is not a relevant DM or not found.`);
                  }
                } catch (e: unknown) {
                  // Catch any unexpected errors in the async block
                  console.error(
                    "[NewDMDetector] Exception in async part of Realtime callback:",
                    e instanceof Error ? e.message : String(e),
                  );
                }
              })(); // Immediately invoke the async function
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log(
            `[NewDMDetector] Successfully subscribed to ${uniqueListenerName}`,
          );
        } else if (
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
        ) {
          console.error(
            `[NewDMDetector] Subscription error on ${uniqueListenerName}:`,
            status,
            err,
          );
        } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
          console.log(
            `[NewDMDetector] Subscription closed for ${uniqueListenerName}`,
          );
        }
      });

    return channel; // Return the SupabaseRealtimeChannel instance
  } catch (error) {
    console.error(
      "[NewDMDetector] Failed to initialize Supabase channel subscription:",
      error,
    );
    return null;
  }
}

/**
 * Unsubscribes from the new DM detector channel.
 * @param channel The SupabaseRealtimeChannel instance returned by subscribeToNewDMs.
 */
export const unsubscribeFromNewDmDetector = async (
  channel: SupabaseRealtimeChannel | null,
): Promise<void> => {
  if (channel) {
    try {
      const status = await channel.unsubscribe();
      console.log(
        `[NewDMDetector] Unsubscribed from ${channel.topic}, status: ${status}`,
      );
      // Optionally remove the channel completely if it won't be reused
      // await supabase.removeChannel(channel);
    } catch (error) {
      console.error(
        `[NewDMDetector] Error unsubscribing from ${channel.topic}:`,
        error,
      );
    }
  }
};

// If you want a generic unsubscription function that can be reused for other RealtimeChannel subscriptions:
// export const unsubscribeFromRealtimeSupabaseChannel = async (channel: SupabaseRealtimeChannel | null): Promise<void> => {
//   if (channel) {
//     try {
//       const status = await channel.unsubscribe();
//       console.log(`[RealtimeUnsub] Unsubscribed from ${channel.topic}, status: ${status}`);
//     } catch (error) {
//       console.error(`[RealtimeUnsub] Error unsubscribing from ${channel.topic}:`, error);
//     }
//   }
// };
