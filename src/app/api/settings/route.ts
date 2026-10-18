import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { DEFAULT_APPEARANCE, resolveAppearance } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    let settings = await SiteSettings.findOne().select("-watermark -testimonials").lean();
    if (!settings) {
      const created = await SiteSettings.create({});
      settings = JSON.parse(JSON.stringify(created));
    }

    return NextResponse.json(
      { settings: { ...JSON.parse(JSON.stringify(settings)), appearance: resolveAppearance(settings?.appearance) } },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        settings: {
          siteName: "CarHat.bd",
          tagline: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
          contactEmail: "carhatbd@gmail.com",
          supportPhone: "+880 1700-000000",
          address: "Plot 12, Road 11, Block C, Gulshan-2, Dhaka 1212, Bangladesh",
          workingHours: "Sat - Thu: 9:00 AM - 8:00 PM (Friday Closed)",
          logoUrl: "/car-hat-bd.png",
          socialLinks: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            instagram: "https://instagram.com",
            youtube: "https://youtube.com",
            linkedin: "https://linkedin.com",
            whatsapp: "+8801700000000",
          },
          googleMapsUrl: "https://maps.google.com/?q=Gulshan-2,Dhaka,Bangladesh",
          copyrightText: "CarHat.bd. All rights reserved.",
          appearance: DEFAULT_APPEARANCE,
        },
      },
      { status: 200 }
    );
  }
}
