import { api } from "@/trpc/server";

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } },
) {
  try {
    const messages = await api.chat.getMessages({
      channelId: params.channelId,
    });
    return Response.json(messages);
  } catch (err) {
    console.error("❌ Failed to get messages:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
