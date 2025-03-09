import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),

    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),

    API_SECRET: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_UPSTASH_URL: z.string(),
    NEXT_PUBLIC_UPSTASH_TOKEN: z.string(),
    NEXT_PUBLIC_WEBSITE_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,

    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

    NEXT_PUBLIC_UPSTASH_URL: process.env.NEXT_PUBLIC_UPSTASH_URL,
    NEXT_PUBLIC_UPSTASH_TOKEN: process.env.NEXT_PUBLIC_UPSTASH_TOKEN,

    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
    API_SECRET: process.env.API_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
