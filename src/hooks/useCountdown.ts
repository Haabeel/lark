import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

const COUNTDOWN_KEY = "countdownEndTime";

const useCountdown = (
  initialSeconds: number,
): [number, (seconds: number) => void, () => void] => {
  const queryClient = useQueryClient();

  // Fetch the stored end time from React Query cache
  const { data: endTime } = useQuery<number | null>({
    queryKey: [COUNTDOWN_KEY],
    queryFn: () => {
      const storedEndTime = localStorage.getItem(COUNTDOWN_KEY);
      return storedEndTime ? parseInt(storedEndTime, 10) : null;
    },
  });

  // Calculate the initial seconds left
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (endTime) {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const remaining = endTime - now;
      return remaining > 0 ? remaining : 0; // Ensure it doesn't go negative
    }
    return initialSeconds;
  });

  // Mutation to update the end time in localStorage and React Query cache
  const { mutate: setEndTime } = useMutation<
    number | null,
    Error,
    number | null
  >({
    mutationFn: async (newEndTime: number | null) => {
      if (newEndTime === null) {
        localStorage.removeItem(COUNTDOWN_KEY);
      } else {
        localStorage.setItem(COUNTDOWN_KEY, newEndTime.toString());
      }
      return Promise.resolve(newEndTime);
    },
    onSuccess: (newEndTime) => {
      queryClient.setQueryData([COUNTDOWN_KEY], newEndTime);
    },
  });

  useEffect(() => {
    if (secondsLeft <= 0) return; // Stop the timer when it reaches 0

    // Calculate and set the end time
    const newEndTime = Math.floor(Date.now() / 1000) + secondsLeft;
    setEndTime(newEndTime);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setEndTime(null); // Clean up storage
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, setEndTime]);

  const start = (seconds: number) => {
    setSecondsLeft(seconds);
  };

  const stop = () => {
    setSecondsLeft(0);
    setEndTime(null);
  };

  return [secondsLeft, start, stop];
};

export default useCountdown;
