export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { User } from "@/lib/models/User";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Share2,
  Heart,
  Eye,
  Palette,
  Zap,
  ChevronRight,
  CheckCircle2,
  Clock,
  BadgeCheck,
  Car,
} from "lucide-react";
import { SellerContactCard } from "@/components/SellerContactCard";
import type { Metadata } from "next";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Generate dynamic metadata for SEO
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug || "");
  const escaped = escapeRegex(decodedSlug);
  try {
    await connectToDatabase();
    const car = (await Listing.findOne({
      $or: [
        { slug: decodedSlug },
        { slug: slug },
        { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    }).lean()) as any;
    if (car) {
      return {
        title: `${car.title} — ৳${car.price?.toLocaleString()} | CarHat.bd`,
        description: car.description?.substring(0, 160),
        openGraph: {
          title: car.title,
          description: car.description?.substring(0, 160),
          images: car.images?.[0] ? [car.images[0]] : [],
        },
      };
    }
  } catch {}
  return { title: "Car Details | CarHat.bd" };
}

export default async function CarDetailsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug || "");
  const escaped = escapeRegex(decodedSlug);

  const query = {
    $or: [
      { slug: decodedSlug },
      { slug: slug },
      { slug: { $regex: new RegExp(`^${escaped}$`, "i") } },
    ],
  };

  let car: any = null;
  let relatedCars: any[] = [];
  try {
    await connectToDatabase();
    try {
      car = (await Listing.findOne(query)
        .populate("sellerId", "name phone email role")
        .lean()) as any;
    } catch (popError) {
      console.error("Populate error, falling back to basic query:", popError);
      car = (await Listing.findOne(query).lean()) as any;
    }

    // Fetch related cars (same make, exclude current)
    if (car) {
      relatedCars = (await Listing.find({
        make: car.make,
        _id: { $ne: car._id },
        status: "active",
      })
        .limit(4)
        .select("title slug price images condition year mileage location")
        .lean()) as any[];

      // If less than 4, fill with other active listings
      if (relatedCars.length < 4) {
        const moreIds = [car._id, ...relatedCars.map((c: any) => c._id)];
        const more = (await Listing.find({
          _id: { $nin: moreIds },
          status: "active",
        })
          .limit(4 - relatedCars.length)
          .select("title slug price images condition year mileage location")
          .lean()) as any[];
        relatedCars = [...relatedCars, ...more];
      }
    }
  } catch (error) {
    console.error("Failed to fetch car details:", error);
  }

  if (!car) {
    notFound();
  }

  // Increment view counter (fire-and-forget)
  try {
    Listing.updateOne({ _id: car._id }, { $inc: { views: 1 } }).exec();
  } catch {}

  const seller = car.sellerId as any;
  const currentViews = (car.views || 0) + 1;

  const conditionBadgeClass =
    car.condition === "new"
      ? "badge-new"
      : car.condition === "reconditioned"
        ? "badge-reconditioned"
        : "badge-used";

  const specItems = [
    { icon: Calendar, label: "Year", value: car.year, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Gauge, label: "Mileage", value: `${car.mileage?.toLocaleString() || "N/A"} km`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Fuel, label: "Fuel", value: car.fuelType, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Settings, label: "Transmission", value: car.transmission, color: "text-violet-500", bg: "bg-violet-500/10" },
    { icon: Zap, label: "Engine", value: `${car.engineSize} cc`, color: "text-pink-500", bg: "bg-pink-500/10" },
    { icon: ShieldCheck, label: "Condition", value: car.condition, color: "text-teal-500", bg: "bg-teal-500/10" },
    { icon: Palette, label: "Color", value: car.color, color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Eye, label: "Views", value: currentViews.toLocaleString(), color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link
          href="/"
          className="hover:text-primary transition-colors font-medium"
        >
          Home
        </Link>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <Link
          href="/cars"
          className="hover:text-primary transition-colors font-medium"
        >
          Cars
        </Link>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="text-foreground font-semibold truncate max-w-[200px]">
          {car.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column – Images & Specs */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* Main Image Gallery */}
          <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
            <div className="relative h-[400px] md:h-[520px] w-full bg-gradient-to-br from-gray-900 to-gray-950">
              <img
                src={
                  car.images?.[0] ||
                  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200"
                }
                alt={car.title}
                className="w-full h-full object-contain"
              />
              {/* Top gradient overlay */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Condition Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span
                  className={`${conditionBadgeClass} px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm`}
                >
                  {car.condition}
                </span>
                {car.featured && (
                  <span className="bg-primary text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/30">
                    Featured
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  className="bg-white/15 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/25 transition-all shadow-lg border border-white/20"
                  title="Save"
                >
                  <Heart size={18} />
                </button>
                <button
                  className="bg-white/15 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/25 transition-all shadow-lg border border-white/20"
                  title="Share"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Image Counter */}
              {car.images && car.images.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border border-white/10">
                  <Eye size={12} />
                  {car.images.length}{" "}
                  {car.images.length === 1 ? "Photo" : "Photos"}
                </div>
              )}
            </div>
            {/* Thumbnails (if multiple) */}
            {car.images && car.images.length > 1 && (
              <div className="flex overflow-x-auto p-3 gap-3 bg-muted/20 border-t border-border">
                {car.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt={`View ${i + 1}`}
                    className="h-20 w-32 object-cover rounded-xl border-2 border-transparent hover:border-primary cursor-pointer transition-all flex-shrink-0 shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Core Specs Grid */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Car size={20} className="text-primary" />
              Vehicle Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {specItems.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-xl border border-border/50 hover:border-primary/20 transition-colors card-hover"
                >
                  <div
                    className={`w-10 h-10 ${spec.bg} rounded-xl flex items-center justify-center mb-2.5`}
                  >
                    <spec.icon size={18} className={spec.color} />
                  </div>
                  <span className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">
                    {spec.label}
                  </span>
                  <span className="font-bold text-sm capitalize">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Description
            </h2>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground text-[15px]">
                {car.description}
              </p>
            </div>
          </div>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-primary" />
                Features & Equipment
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {car.features.map((feature: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-sm p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-emerald-500 flex-shrink-0"
                    />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column – Price & Seller (Sticky) */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24 space-y-5">
            {/* Price Box — Premium Card */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Accent gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-pink-500 to-amber-500" />
              <div className="p-6">
                <h1 className="text-xl font-bold mb-1.5 leading-tight">
                  {car.title}
                </h1>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm mb-5">
                  <MapPin size={14} /> {car.location}
                </p>

                {/* Price — Big, Clear, Readable */}
                <div className="bg-gradient-to-br from-primary/5 via-transparent to-pink-500/5 border border-primary/10 rounded-xl p-5 mb-5">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                    Asking Price
                  </p>
                  <div className="price-tag text-4xl md:text-[2.75rem] text-primary leading-none">
                    ৳ {car.price?.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground price-display">
                      EMI from{" "}
                      <span className="font-bold text-foreground">
                        ৳{" "}
                        {Math.round((car.price || 0) / 60).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                      /month{" "}
                      <span className="text-xs">(approx. 5yr)</span>
                    </p>
                  </div>
                </div>

                <SellerContactCard
                  listingId={car._id.toString()}
                  sellerId={seller?._id?.toString() || ""}
                  carTitle={car.title}
                />
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <UserIcon size={16} className="text-primary" />
                Seller Information
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white text-xl font-bold">
                    {(seller?.name || "P")[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-base flex items-center gap-1.5">
                    {seller?.name || "Private Seller"}
                    <BadgeCheck
                      size={16}
                      className="text-blue-500 fill-blue-500/20"
                    />
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {seller?.role || "Individual"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                <ShieldCheck size={16} />
                <span className="font-medium">Verified Member</span>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-3 text-sm flex items-center gap-2">
                <ShieldCheck size={16} />
                Safety Tips
              </h3>
              <ul className="text-sm text-amber-900/70 dark:text-amber-200/70 space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Never pay in advance to a seller you do not know.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Meet the seller in a safe, public location.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Have the vehicle inspected by a trusted mechanic.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  Verify documents before completing the transaction.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Related Cars */}
      {relatedCars.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Car size={22} className="text-primary" />
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedCars.map((related: any) => {
              const relCondClass =
                related.condition === "new"
                  ? "badge-new"
                  : related.condition === "reconditioned"
                    ? "badge-reconditioned"
                    : "badge-used";
              return (
                <Link
                  key={related._id.toString()}
                  href={`/cars/${related.slug}`}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group card-hover flex flex-col"
                >
                  <div className="relative h-40 overflow-hidden bg-muted">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                      style={{
                        backgroundImage: `url(${related.images?.[0] || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=600"})`,
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span
                        className={`${relCondClass} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm`}
                      >
                        {related.condition}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="price-tag text-lg text-primary mb-2">
                      ৳ {related.price?.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{related.year}</span>
                      <span>•</span>
                      <span>
                        {related.mileage?.toLocaleString()} km
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
