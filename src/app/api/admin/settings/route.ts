import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models/SiteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // Get or create singleton settings document
    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      const created = await SiteSettings.create({});
      settings = JSON.parse(JSON.stringify(created));
    }

    return NextResponse.json({
      settings: JSON.parse(JSON.stringify(settings)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    delete body._id;
    delete body.__v;

    // Upsert the singleton settings document
    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      settings: JSON.parse(JSON.stringify(settings)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
