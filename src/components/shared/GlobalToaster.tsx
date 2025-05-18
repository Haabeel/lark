"use client";

import { useProgress } from "@/providers/ProgressProvider";
import { useEffect } from "react";
import { toast } from "sonner";
import { Slider } from "../ui/slider";

export const GlobalProgressToast = () => {
  const progressData = useProgress();
  const progress = progressData?.progress?.progress;
  const progressStep = progressData?.progress?.step;
  useEffect(() => {
    if (!progress) return;

    toast.custom(
      () => (
        <div className="flex w-full max-w-sm flex-col gap-2 rounded-md bg-white p-4 shadow dark:bg-zinc-900">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {progressStep}
          </div>
          <div className="h-2 w-full rounded bg-gray-200">
            <Slider
              className="h-full rounded bg-blue-600 transition-all duration-300"
              value={[progress]}
            />
          </div>
        </div>
      ),
      {
        id: "project-progress",
        duration: Infinity,
      },
    );

    if (progress >= 100) {
      toast.dismiss("project-progress");
      toast.success("Project processing completed!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return null;
};
