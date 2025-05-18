"use client";

import { api } from "@/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export type Messages = inferRouterOutputs<AppRouter>["chat"]["getMessages"];
export type Message = Messages["messages"][number];
export const useChannelMessages = (channelId: string | undefined) => {
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = api.chat.getMessages.useQuery(
    { channelId: channelId! },
    {
      enabled: !!channelId, // Only run if channelId is defined
    },
  );

  return {
    messages,
    isLoading,
    isError,
    refetch,
  };
};
