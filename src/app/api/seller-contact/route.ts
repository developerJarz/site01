import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const listing = await Listing.findById(listingId).lean() as any;
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const seller = await User.findById(listing.sellerId)
      .select("name phone whatsappNumber allowPhoneDisplay allowWhatsApp role avatar")
      .lean() as any;

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      seller: {
        name: seller.name,
        role: seller.role,
        avatar: seller.avatar || null,
        phone: seller.allowPhoneDisplay ? seller.phone : null,
        showPhone: seller.allowPhoneDisplay && !!seller.phone,
        whatsappNumber: seller.allowWhatsApp ? seller.whatsappNumber : null,
        showWhatsApp: seller.allowWhatsApp && !!seller.whatsappNumber,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
