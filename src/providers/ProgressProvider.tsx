"use client";

import useRefetch from "@/hooks/useRefetch";
import { supabase } from "@/lib/supabaseClient";
import { type RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

type ProgressUpdate = {
  id: string;
  projectId: string;
  step: string;
  progress: number;
  createdAt: string;
};

type ProgressContextType = {
  projectId: string | null;
  setProjectId: (id: string) => void;
  progress: ProgressUpdate | null;
  setProgress: (data: ProgressUpdate) => void;
};

const ProgressContext = createContext<ProgressContextType | null>(null);
export const useProgress = () => useContext(ProgressContext);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const refetch = useRefetch();

  // supabase subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`progress:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Progress",
          filter: `projectId=eq.${projectId}`,
        },
        (payload: RealtimePostgresInsertPayload<ProgressUpdate>) => {
          const newProgress = payload.new;
          setProgress(newProgress);
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [projectId]);

  return (
    <ProgressContext.Provider
      value={{ projectId, setProjectId, progress, setProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
