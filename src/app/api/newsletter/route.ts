import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { NewsletterRequestError, parseNewsletterSignup } from "@/lib/newsletter-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const email = await parseNewsletterSignup(request);
    await connectToDatabase();
    try {
      // Signing up twice is not an error: the visitor is subscribed either way.
      await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }
    return NextResponse.json({ subscribed: true });
  } catch (error) {
    if (error instanceof NewsletterRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Newsletter signup failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not subscribe right now. Please try again." }, { status: 500 });
  }
}
