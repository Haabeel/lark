import { type AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";

export type DMChannel =
  inferRouterOutputs<AppRouter>["chat"]["getUserDms"][number];

export const useUserDms = () => {
  const { data, isLoading, error, isError, refetch } =
    api.chat.getUserDms.useQuery();
  console.log("useUserDms", data);
  return {
    channels: data ?? [],
    channelIds: data?.map((data) => ({ id: data.id })) ?? [],
    isLoading,
    error,
    isError,
    refetch,
  };
};
