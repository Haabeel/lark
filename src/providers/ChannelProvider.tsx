"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  useEffect,
} from "react";
import { type Messages } from "@/hooks/useChannelMessages";

const ChannelContext = createContext<{
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
  messages: Messages;
  setMessages: Dispatch<SetStateAction<Messages>>;
  isLoadingMessages: boolean; // <-- NEW
  setIsLoadingMessages: Dispatch<SetStateAction<boolean>>; // <-- NEW
} | null>(null);

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Messages>({
    messages: [],
    hasMore: false,
    nextOffset: 0,
  });
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true); // <-- NEW STATE, default to true

  // When activeChannelId changes, reset messages and set loading to true
  // This is crucial for the skeleton to show when switching channels.
  useEffect(() => {
    if (activeChannelId) {
      setMessages({ messages: [], hasMore: true, nextOffset: 0 }); // Reset messages
      setIsLoadingMessages(true); // Set loading true for the new channel
    } else {
      // No active channel, clear messages and set loading to false
      setMessages({ messages: [], hasMore: false, nextOffset: 0 });
      setIsLoadingMessages(false);
    }
  }, [activeChannelId]);
  return (
    <ChannelContext.Provider
      value={{
        activeChannelId,
        setActiveChannelId,
        messages,
        setMessages,
        isLoadingMessages, // <-- PASS TO PROVIDER
        setIsLoadingMessages,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

// Hooks

export const useActiveChannelId = () => {
  const context = useContext(ChannelContext);
  if (!context)
    throw new Error("useActiveChannelId must be used inside ChannelProvider");
  return context.activeChannelId;
};

export const useSetActiveChannelId = () => {
  const context = useContext(ChannelContext);
  if (!context)
    throw new Error(
      "useSetActiveChannelId must be used inside ChannelProvider",
    );
  return context.setActiveChannelId;
};

export const useActiveChannelMessages = () => {
  const context = useContext(ChannelContext);
  if (!context)
    throw new Error(
      "useActiveChannelMessages must be used inside ChannelProvider",
    );
  return context.messages;
};

export const useSetActiveChannelMessages = () => {
  const context = useContext(ChannelContext);
  if (!context)
    throw new Error(
      "useSetActiveChannelMessages must be used inside ChannelProvider",
    );
  return context.setMessages;
};

export const useIsLoadingMessages = (): boolean => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error("useIsLoadingMessages must be used inside ChannelProvider");
  }
  return context.isLoadingMessages;
};

export const useSetIsLoadingMessages = (): Dispatch<
  SetStateAction<boolean>
> => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error(
      "useSetIsLoadingMessages must be used inside ChannelProvider",
    );
  }
  return context.setIsLoadingMessages;
};
