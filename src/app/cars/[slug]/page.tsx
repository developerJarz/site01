import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Eye, MapPin, ShieldCheck, Check } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import "@/lib/models/User";
import { SellerContactCard } from "@/components/SellerContactCard";
import { CarCard, Price, type CarCardData } from "@/components/CarCard";
import { CarGallery } from "@/components/car/CarGallery";
import { ShareButton } from "@/components/car/ShareButton";
import { EmiCalculator } from "@/components/car/EmiCalculator";
import { escapeRegex, formatKm, formatLakh, formatTaka, listingImageUrl, timeAgo, withServedImages } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  new: "New", used: "Used", reconditioned: "Reconditioned",
  petrol: "Petrol", diesel: "Diesel", cng: "CNG", hybrid: "Hybrid", electric: "Electric", octane: "Octane",
  automatic: "Automatic", manual: "Manual", "semi-automatic": "Semi-automatic",
};
const label = (v?: string) => (v ? LABELS[v] || v.charAt(0).toUpperCase() + v.slice(1) : "—");

// Shared by generateMetadata and the page, so the listing is only fetched once per request.
const getCar = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug || "");
  await connectToDatabase();
  return (await Listing.findOne({
    $or: [{ slug: decoded }, { slug }, { slug: { $regex: new RegExp(`^${escapeRegex(decoded)}$`, "i") } }],
  })
    .select({ documents: 0 })
    .populate("sellerId", "name role isVerified dealershipName city createdAt")
    .lean()) as any;
});

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const car = await getCar(slug);
    if (car) {
      const description = car.description?.substring(0, 160);
      const cover = listingImageUrl(car._id, car.images?.[0]);
      return {
        title: `${car.title}, ${formatLakh(car.price)}`,
        description,
        openGraph: { title: car.title, description, images: cover ? [cover] : [] },
      };
    }
  } catch {}
  return { title: "Car details" };
}

export default async function CarDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  let car: any = null;
  let related: CarCardData[] = [];
  try {
    car = await getCar(slug);
    if (car) {
      const fields = {
        title: 1, slug: 1, price: 1, make: 1, year: 1, mileage: 1, fuelType: 1, transmission: 1,
        condition: 1, location: 1, featured: 1, paperVerified: 1, images: { $slice: 1 },
      };
      const [sameMake, others] = await Promise.all([
        Listing.find({ make: car.make, _id: { $ne: car._id }, status: "active" }).select(fields).limit(4).lean(),
        Listing.find({ make: { $ne: car.make }, status: "active" }).select(fields).sort({ views: -1 }).limit(4).lean(),
      ]);
      related = JSON.parse(JSON.stringify([...sameMake, ...others].slice(0, 4).map(withServedImages)));
      // Count the view without making the visitor wait for the write.
      Listing.updateOne({ _id: car._id }, { $inc: { views: 1 } }).exec().catch(() => {});
    }
  } catch (error) {
    console.error("Failed to fetch car details:", error);
  }

  if (!car) notFound();

  const seller = car.sellerId as any;
  const images: string[] = (car.images || []).map((src: string, i: number) => listingImageUrl(car._id, src, i));
  const views = (car.views || 0) + 1;
  const isSold = car.status === "sold";

  const specs = [
    { label: "Year", value: car.year },
    { label: "Mileage", value: formatKm(car.mileage) },
    { label: "Fuel", value: label(car.fuelType) },
    { label: "Transmission", value: label(car.transmission) },
    { label: "Engine", value: car.engineSize ? `${Number(car.engineSize).toLocaleString("en-IN")} cc` : "—" },
    { label: "Condition", value: label(car.condition) },
    { label: "Colour", value: car.color ? car.color.charAt(0).toUpperCase() + car.color.slice(1) : "—" },
    { label: "Make and model", value: [car.make, car.model].filter(Boolean).join(" ") || "—" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex min-w-0 items-center gap-2">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/cars" className="hover:text-primary">Cars</Link></li>
          {car.make && (
            <>
              <li aria-hidden>/</li>
              <li><Link href={`/cars?make=${encodeURIComponent(car.make)}`} className="hover:text-primary">{car.make}</Link></li>
            </>
          )}
        </ol>
      </nav>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-semiwide text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">{car.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin size={16} className="text-teal-ink" aria-hidden /> {car.location}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} aria-hidden /> Listed {timeAgo(car.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5 tabular"><Eye size={16} aria-hidden /> {views.toLocaleString("en-IN")} views</span>
          </p>
        </div>
        <ShareButton title={car.title} />
      </header>

      {isSold && (
        <p className="mt-5 rounded-lg border border-[#f1d898] bg-[#fdf3dc] px-4 py-3 font-semibold text-[#7a5200]">
          This car has been sold. Similar cars are listed below.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 space-y-8">
          <CarGallery images={images} title={car.title}>
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
              {car.paperVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-verified px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm">
                  <ShieldCheck size={16} aria-hidden /> Paper Verified
                </span>
              )}
              {car.featured && (
                <span className="rounded-md bg-marigold px-2.5 py-1.5 text-sm font-semibold text-foreground shadow-sm">Featured</span>
              )}
            </div>
          </CarGallery>

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="text-xl font-bold">Key details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="bg-card px-4 py-3.5">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="mt-0.5 font-semibold tabular">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {car.description && (
            <section aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="text-xl font-bold">From the seller</h2>
              <p className="mt-3 max-w-[70ch] whitespace-pre-line text-[17px] leading-relaxed text-foreground/90">{car.description}</p>
            </section>
          )}

          {car.features?.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="text-xl font-bold">Features</h2>
              <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 md:grid-cols-3">
                {car.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2.5 text-[15px]">
                    <Check size={16} className="shrink-0 text-teal-ink" strokeWidth={2.75} aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="papers-heading"
            className={car.paperVerified ? "rounded-xl border border-[#b5e2cb] bg-[#effaf4] p-5" : "rounded-xl border border-border bg-card p-5"}
          >
            <h2 id="papers-heading" className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck size={20} className={car.paperVerified ? "text-verified" : "text-muted-foreground"} aria-hidden />
              {car.paperVerified ? "Papers checked by CarHat" : "Papers not checked yet"}
            </h2>
            <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-muted-foreground">
              {car.paperVerified
                ? "Our team has reviewed the registration certificate, tax token and fitness certificate the seller uploaded. Still see the originals in person before you pay."
                : "The seller hasn't had their documents checked by CarHat. Ask to see the registration certificate, tax token and fitness certificate before you pay."}
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div id="contact" className="scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Asking price</p>
            <Price value={car.price} size="lg" className="mt-1" />
            <p className="mt-2 text-sm text-muted-foreground tabular">{formatTaka(car.price)}</p>

            {!isSold && (
              <div className="mt-5">
                <SellerContactCard listingId={car._id.toString()} sellerId={seller?._id?.toString() || ""} carTitle={car.title} />
              </div>
            )}

            {seller && (
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">
                  {(seller.dealershipName || seller.name || "S")[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {seller.dealershipName || seller.name}
                    {seller.isVerified && <BadgeCheck size={17} className="shrink-0 text-primary" aria-label="Verified account" />}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {seller.role === "dealer" ? "Dealer" : "Private seller"}
                    {seller.createdAt && `, on CarHat since ${new Date(seller.createdAt).getFullYear()}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isSold && car.price > 0 && <EmiCalculator price={car.price} />}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-bold">Before you pay</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-muted-foreground">
              <li>Don&apos;t send an advance to a seller you haven&apos;t met.</li>
              <li>Meet in daylight, somewhere public.</li>
              <li>Have a mechanic you trust inspect the car.</li>
              <li>Match the chassis number with the registration papers.</li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="defer-render mt-16">
          <h2 id="related-heading" className="font-semiwide text-2xl font-extrabold">You might also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((c) => (
              <CarCard key={c._id} car={c} sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 92vw" />
            ))}
          </div>
        </section>
      )}

      {/* Phones: keep price and the contact action in reach while scrolling. */}
      {!isSold && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <Price value={car.price} size="sm" />
          <a href="#contact" className="rounded-lg bg-primary px-5 py-3 text-[15px] font-semibold text-primary-foreground">
            Contact seller
          </a>
        </div>
      )}
    </div>
  );
}
