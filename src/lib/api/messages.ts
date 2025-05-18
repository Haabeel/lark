import { api } from "@/trpc/server";

export async function fetchOlderMessages(
  channelId: string,
  offset: number,
  limit = 20,
) {
  return await api.chat.getMessages({
    channelId,
    offset,
    limit,
  });
}
