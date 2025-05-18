import { api } from "@/trpc/server";

export async function GET(
  req: Request,
  { params: paramsPromise }: { params: Promise<{ channelId: string }> }, // params is a Promise
) {
  try {
    const params = await paramsPromise; // Await the promise to get the actual params object
    const { channelId } = params;
    const messages = await api.chat.getMessages({
      channelId: channelId,
    });
    return Response.json(messages);
  } catch (err) {
    console.error("❌ Failed to get messages:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
