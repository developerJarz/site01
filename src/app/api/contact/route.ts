import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { ContactRequestError, parseContactRequest } from "@/lib/contact-request";

export const dynamic = "force-dynamic";

/** Messages from the contact page land in Admin → Inbox. */
export async function POST(request: Request) {
  try {
    const input = await parseContactRequest(request);
    if (!input) return NextResponse.json({ sent: true });
    await connectToDatabase();

    // At most three messages an hour from one address, so the inbox can't be flooded.
    const recent = await ContactMessage.countDocuments({ email: input.email, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
    if (recent >= 3) {
      return NextResponse.json({ error: "We've got your earlier messages and will reply soon." }, { status: 429 });
    }

    await ContactMessage.create(input);
    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof ContactRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Contact message failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Couldn't send your message. Please try again or call us." }, { status: 500 });
  }
}
