import { api } from "@/trpc/react";

export const useUserChannelIds = (userId?: string) => {
  const isEnabled = !!userId;

  const { data, isLoading, error, refetch } =
    api.chat.getAllUserChannelIds.useQuery(
      { userId: userId! }, // You know it's defined because of `enabled`
      { enabled: isEnabled }, // Only runs when userId is available
    );

  return {
    channelIds: data?.map((channel) => channel.channelId) ?? [],
    channels: data ?? [],
    isLoading,
    error,
    refetch,
  };
};
