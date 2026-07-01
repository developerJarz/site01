import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const title = `${body.year} ${body.make} ${body.model}`;
    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Math.floor(Math.random() * 10000);

    const listing = await Listing.create({
      ...body,
      title,
      slug,
      sellerId: (session.user as any).id,
      status: "active",
      images:
        body.images && body.images.length > 0
          ? body.images
          : [
              "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000",
            ],
      documents: body.documents || [],
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const make = searchParams.get("make");
    const location = searchParams.get("location");

    const query: any = { status: "active" };
    if (make) query.make = { $regex: new RegExp(`^${make}$`, "i") };
    if (location) query.location = { $regex: location, $options: "i" };

    await connectToDatabase();
    const listings = await Listing.find(query).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ listings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
