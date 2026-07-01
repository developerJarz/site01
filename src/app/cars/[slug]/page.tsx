export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Phone,
  MessageSquare,
  ShieldCheck,
  User as UserIcon,
  Share2,
  Heart,
  Eye,
  Palette,
  Zap,
} from "lucide-react";
import { SellerContactCard } from "@/components/SellerContactCard";

export default async function CarDetailsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  await connectToDatabase();

  const car = await Listing.findOne({ slug })
    .populate("sellerId", "name phone email role")
    .lean() as any;

  if (!car) {
    notFound();
  }

  // Increment view counter (fire-and-forget)
  Listing.updateOne({ _id: car._id }, { $inc: { views: 1 } }).exec();

  const seller = car.sellerId as any;
  const currentViews = (car.views || 0) + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cars" className="hover:text-primary transition-colors">Cars</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{car.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column – Images & Specs */}
        <div className="w-full lg:w-2/3 space-y-8">
          {/* Main Image Gallery */}
          <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
            <div className="relative h-[400px] md:h-[500px] w-full bg-black">
              <img
                src={car.images?.[0] || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200"}
                alt={car.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                FEATURED
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-md" title="Save">
                  <Heart size={18} />
                </button>
                <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors shadow-md" title="Share">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
            {/* Thumbnails (if multiple) */}
            {car.images && car.images.length > 1 && (
              <div className="flex overflow-x-auto p-4 gap-4 bg-muted/30">
                {car.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt={`View ${i + 1}`}
                    className="h-20 w-32 object-cover rounded-lg border-2 border-transparent hover:border-primary cursor-pointer transition-all"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Core Specs Grid */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 border-b border-border pb-4">
              Vehicle Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Calendar size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Year</span>
                <span className="font-semibold">{car.year}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Gauge size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Mileage</span>
                <span className="font-semibold">{car.mileage?.toLocaleString() || "N/A"} km</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Fuel size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Fuel</span>
                <span className="font-semibold capitalize">{car.fuelType}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Settings size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Transmission</span>
                <span className="font-semibold capitalize">{car.transmission}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Zap size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Engine</span>
                <span className="font-semibold">{car.engineSize} cc</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <ShieldCheck size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Condition</span>
                <span className="font-semibold capitalize">{car.condition}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Palette size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Color</span>
                <span className="font-semibold capitalize">{car.color}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-xl">
                <Eye size={20} className="text-primary mb-2" />
                <span className="text-xs text-muted-foreground mb-1">Views</span>
                <span className="font-semibold">{currentViews}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 border-b border-border pb-4">
              Description
            </h2>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {car.description}
              </p>
            </div>
          </div>

          {/* Features (if available) */}
          {car.features && car.features.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 border-b border-border pb-4">
                Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {car.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column – Price & Seller */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24 space-y-6">
            {/* Price Box */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold mb-2 leading-tight">
                {car.title}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1 mb-6">
                <MapPin size={16} /> {car.location}
              </p>
              <div className="text-4xl font-extrabold text-primary mb-2">
                ৳ {car.price?.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                EMI from ৳ {Math.round((car.price || 0) / 60).toLocaleString()}/month
              </p>
              
              <SellerContactCard 
                listingId={car._id.toString()} 
                sellerId={seller?._id?.toString() || ""} 
                carTitle={car.title} 
              />
            </div>

            {/* Seller Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Seller Information</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border-2 border-primary/20">
                  <UserIcon size={24} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {seller?.name || "Private Seller"}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {seller?.role || "Individual"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-500/10 p-3 rounded-lg">
                <ShieldCheck size={18} /> Verified Member
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="font-bold text-amber-700 dark:text-amber-500 mb-3">
                Safety Tips
              </h3>
              <ul className="text-sm text-amber-900/80 dark:text-amber-200/80 space-y-2 list-disc pl-4">
                <li>Never pay in advance to a seller you do not know.</li>
                <li>Meet the seller in a safe, public location.</li>
                <li>Have the vehicle inspected by a trusted mechanic.</li>
                <li>Verify documents before completing the transaction.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
