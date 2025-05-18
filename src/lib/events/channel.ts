import { supabase } from "@/lib/supabaseClient";
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";
import { type Channel } from "@prisma/client";

type ChannelChangeEvent = "INSERT" | "UPDATE" | "DELETE";

export type ChannelChangeHandler = (change: {
  event: ChannelChangeEvent;
  channelId: string;
  data: Channel;
}) => void;

export function subscribeToChannelChanges(
  channelId: string,
  onChange: ChannelChangeHandler,
): RealtimeChannel {
  return supabase
    .channel(`channel-changes-${channelId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "channel",
        filter: `id=eq.${channelId}`,
      },
      (
        payload:
          | RealtimePostgresInsertPayload<Channel>
          | RealtimePostgresUpdatePayload<Channel>
          | RealtimePostgresDeletePayload<Channel>,
      ) => {
        const eventType = payload.eventType;
        const data = eventType === "DELETE" ? payload.old : payload.new;
        const changedChannelId = data?.id;

        if (!changedChannelId || !data) return;
        console.log("connect", channelId, eventType, data);
        onChange({
          event: eventType,
          channelId: changedChannelId,
          data: data as Channel,
        });
      },
    )
    .subscribe();
}

export async function unsubscribeFromChannel(channel: RealtimeChannel) {
  await channel.unsubscribe();
}
