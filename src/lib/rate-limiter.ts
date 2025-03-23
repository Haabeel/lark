import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1m"),
});
