import { initEdgeStoreClient } from "@edgestore/server/core";
import { initEdgeStore } from "@edgestore/server/";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { z } from "zod";
const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
  profile: es
    .imageBucket()
    .input(z.object({ user: z.string(), provider: z.string() }))
    .path(({ input }) => [{ user: input.user }, { provider: input.provider }]),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export type EdgeStoreRouter = typeof edgeStoreRouter;

export const backendClient = initEdgeStoreClient({
  router: edgeStoreRouter,
});
