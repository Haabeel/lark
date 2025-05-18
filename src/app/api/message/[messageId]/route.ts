// src/app/api/message/[messageId]/route.ts
import { api } from "@/trpc/server";
import { type NextRequest, NextResponse } from "next/server";

// This is the standard and now Promise-based signature for params
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ messageId: string }> }, // params is a Promise
) {
  const params = await paramsPromise; // Await the promise to get the actual params object
  const { messageId } = params;

  if (typeof messageId !== "string" || !messageId) {
    return NextResponse.json(
      { error: "Invalid or missing messageId" },
      { status: 400 },
    );
  }

  try {
    const message = await api.chat.getMessage({ messageId });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("❌ Error fetching message via API route:", error);

    // More specific error handling for tRPC errors
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
