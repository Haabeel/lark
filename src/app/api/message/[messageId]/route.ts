import { api } from "@/trpc/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const { messageId } = params;

  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  try {
    const message = await api.chat.getMessage({ messageId });
    console.log("📩 Message fetched:", message);
    return NextResponse.json(message);
  } catch (error) {
    console.error("❌ Error fetching message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
