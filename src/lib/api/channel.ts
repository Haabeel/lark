import { api } from "@/trpc/react";

export const getUserChannelIds = (userId: string): string[] => {
  const res = api.chat.getAllUserChannelIds.useQuery({
    userId,
  });
  return res.data ?? [];
};
