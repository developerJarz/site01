import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, CalendarDays, Car, Check, Eye, Flag, Fuel, Gauge, MapPin, Palette, Settings2, ShieldAlert, ShieldCheck, Sparkles, Wrench,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import "@/lib/models/User";
import { SellerContactCard } from "@/components/SellerContactCard";
import { UserAvatar } from "@/components/UserAvatar";
import { CarCard, CONDITION_LABEL, FUEL_LABEL, GEAR_LABEL, Price, type CarCardData } from "@/components/CarCard";
import { CarGallery } from "@/components/car/CarGallery";
import { CarActions } from "@/components/car/CarActions";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs, CONTAINER } from "@/components/ui/page";
import { isHotDeal, loadMarketStats } from "@/lib/hot-deals";
import { cn, escapeRegex, formatKm, formatLakh, formatTaka, listingImageUrl, timeAgo, withServedImages } from "@/lib/utils";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { brandSlug } from "@/lib/seo-pages";
import { cityOf, listingImageAlt, listingSeoDescription, listingSeoTitle, shareImageUrl } from "@/lib/seo-text";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const label = (map: Record<string, string>, v?: string) => (v ? map[v] || v.charAt(0).toUpperCase() + v.slice(1) : "—");

// Shared by generateMetadata and the page, so the listing is only fetched once per request.
const getCar = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug || "");
  await connectToDatabase();
  return (await Listing.findOne({
    $or: [{ slug: decoded }, { slug }, { slug: { $regex: new RegExp(`^${escapeRegex(decoded)}$`, "i") } }],
  })
    .select({ documents: 0 })
    .populate("sellerId", "name role isVerified dealershipName city createdAt avatar")
    .lean()) as any;
});

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const car = await getCar(slug);
    if (car) {
      const cover = shareImageUrl(listingImageUrl(car._id, car.images?.[0]));
      return buildMetadata(`/cars/${car.slug}`, {
        // A custom SEO title is used as written; generated ones get the site suffix.
        title: listingSeoTitle(car),
        useTemplate: !car.seoTitle,
        socialTitle: `${car.title} – ${formatLakh(car.price)}`,
        description: listingSeoDescription(car),
        keywords: [
          `${car.make} ${car.model} price in Bangladesh`,
          `used ${car.make} ${car.model} for sale`,
          `${car.make} ${car.model} ${car.year}`,
          `${car.make} car price in ${cityOf(car.location)}`,
        ],
        images: cover ? [{ url: cover, alt: listingImageAlt(car, 0) }] : undefined,
        // Sold or removed cars stay reachable but drop out of search results.
        noindex: car.status !== "active",
      });
    }
  } catch {}
  return { title: "Car details", robots: { index: false } };
}

const CARD_FIELDS = {
  title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, mileage: 1, fuelType: 1, transmission: 1,
  condition: 1, location: 1, featured: 1, paperVerified: 1, status: 1, sellerId: 1, color: 1, images: { $slice: 1 }, imageAlts: { $slice: 1 },
};

export default async function CarDetailsPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  let car: any = null;
  let related: CarCardData[] = [];
  let hotDeal = false;
  try {
    car = await getCar(slug);
    if (car) {
      const [sameMake, others, market] = await Promise.all([
        Listing.find({ make: car.make, _id: { $ne: car._id }, status: "active" }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(4)
          .populate("sellerId", "name role isVerified dealershipName").lean(),
        Listing.find({ make: { $ne: car.make }, status: "active" }).select(CARD_FIELDS).sort({ views: -1 }).limit(4)
          .populate("sellerId", "name role isVerified dealershipName").lean(),
        loadMarketStats(),
      ]);
      hotDeal = isHotDeal(market, car);
      related = JSON.parse(JSON.stringify([...sameMake, ...others].slice(0, 4).map((c: any) => {
        const { sellerId, ...rest } = withServedImages(c);
        return { ...rest, hotDeal: isHotDeal(market, c), seller: sellerId && typeof sellerId === "object" ? sellerId : undefined };
      })));
      // Count the view without making the visitor wait for the write.
      Listing.updateOne({ _id: car._id }, { $inc: { views: 1 } }).exec().catch(() => {});
    }
  } catch (error) {
    console.error("Failed to fetch car details:", error);
  }

  if (!car) notFound();

  const seller = car.sellerId as any;
  const rawImages = Array.isArray(car.images) ? car.images : [];
  const images: string[] = rawImages
    .map((src: string, i: number) => listingImageUrl(car._id, src, i))
    .filter((url: string | undefined): url is string => Boolean(url && typeof url === "string" && url.trim().length > 0));
  const views = (car.views || 0) + 1;
  const isSold = car.status === "sold";
  const sellerName = seller?.dealershipName || seller?.name;
  const cardData: CarCardData = JSON.parse(JSON.stringify({
    _id: String(car._id), slug: car.slug, title: car.title, price: car.price, make: car.make, model: car.model, year: car.year,
    mileage: car.mileage, fuelType: car.fuelType, transmission: car.transmission, condition: car.condition, location: car.location,
    images: images.slice(0, 1), featured: car.featured, paperVerified: !!car.paperVerified, status: car.status,
    seller: seller ? { name: seller.name, role: seller.role, isVerified: !!seller.isVerified, dealershipName: seller.dealershipName || undefined } : undefined,
  }));

  const alts = images.map((_, i) => listingImageAlt(car, i));
  const pageUrl = absoluteUrl(`/cars/${car.slug}`);
  const brandPath = car.make ? `/brands/${brandSlug(car.make)}` : "";
  const condition = car.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition";
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Car",
      name: car.title,
      description: listingSeoDescription(car),
      url: pageUrl,
      image: images.slice(0, 8).map((u) => absoluteUrl(u)),
      ...(car.make ? { brand: { "@type": "Brand", name: car.make } } : {}),
      ...(car.model ? { model: car.model } : {}),
      ...(car.year ? { vehicleModelDate: String(car.year) } : {}),
      ...(car.mileage ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage, unitCode: "KMT" } } : {}),
      ...(car.fuelType ? { fuelType: label(FUEL_LABEL, car.fuelType) } : {}),
      ...(car.transmission ? { vehicleTransmission: label(GEAR_LABEL, car.transmission) } : {}),
      ...(car.engineSize ? { vehicleEngine: { "@type": "EngineSpecification", engineDisplacement: { "@type": "QuantitativeValue", value: car.engineSize, unitCode: "CMQ" } } } : {}),
      ...(car.color ? { color: car.color } : {}),
      itemCondition: condition,
      offers: {
        "@type": "Offer",
        url: pageUrl,
        price: car.price,
        priceCurrency: "BDT",
        itemCondition: condition,
        availability: isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        areaServed: { "@type": "City", name: cityOf(car.location) },
        ...(sellerName ? { seller: { "@type": seller?.role === "dealer" || seller?.dealershipName ? "AutoDealer" : "Person", name: sellerName } } : {}),
      },
    },
    breadcrumbLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: "Cars for sale", url: absoluteUrl("/cars") },
      ...(car.make ? [{ name: `${car.make} cars`, url: absoluteUrl(brandPath) }] : []),
      { name: car.title, url: pageUrl },
    ]),
  ];

  const highlights = [
    { icon: CalendarDays, label: "Year", value: car.year || "—" },
    { icon: Gauge, label: "Mileage", value: formatKm(car.mileage) },
    { icon: Fuel, label: "Fuel", value: label(FUEL_LABEL, car.fuelType) },
    { icon: Settings2, label: "Transmission", value: label(GEAR_LABEL, car.transmission) },
  ];
  const specs = [
    { icon: Car, label: "Make and model", value: [car.make, car.model].filter(Boolean).join(" ") || "—" },
    { icon: Sparkles, label: "Condition", value: label(CONDITION_LABEL, car.condition) },
    { icon: Wrench, label: "Engine", value: car.engineSize ? `${Number(car.engineSize).toLocaleString("en-IN")} cc` : "—" },
    { icon: Palette, label: "Colour", value: car.color ? car.color.charAt(0).toUpperCase() + car.color.slice(1) : "—" },
    { icon: MapPin, label: "Location", value: car.location || "—" },
    { icon: Eye, label: "Views", value: views.toLocaleString("en-IN") },
  ];

  return (
    <div className="bg-white">
      <JsonLd data={structuredData} />
      <div className={cn(CONTAINER, "pb-32 pt-6 lg:pb-20")}>
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Cars", href: "/cars" },
          ...(car.make ? [{ label: car.make, href: brandPath }] : []),
          { label: car.model || car.title },
        ]} />

        <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {car.paperVerified && <Badge variant="verified" className="border border-verified/20"><ShieldCheck aria-hidden /> Paper Verified</Badge>}
              {car.featured && <Badge><Sparkles aria-hidden /> Featured</Badge>}
              {hotDeal && !isSold && <Badge variant="hot">Hot Deal</Badge>}
              {car.condition && <Badge variant="soft">{label(CONDITION_LABEL, car.condition)}</Badge>}
            </div>
            <h1 className="mt-3 text-[1.9rem] font-extrabold leading-[1.1] text-night sm:text-4xl md:text-[2.75rem]">{car.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-slate-text">
              <span className="inline-flex items-center gap-1.5"><MapPin size={16} className="text-electric" aria-hidden /> {car.location}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} aria-hidden /> Listed {timeAgo(car.createdAt)}</span>
              <span className="inline-flex items-center gap-1.5 tabular"><Eye size={16} aria-hidden /> {views.toLocaleString("en-IN")} views</span>
            </p>
          </div>
          <CarActions car={cardData} />
        </header>

        {isSold && (
          <p className="mt-5 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 font-semibold text-warning">
            This car has been sold. Similar cars are listed below.
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-10">
            <CarGallery images={images} alts={alts} title={car.title} />

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Highlights">
              {highlights.map(({ icon: Icon, label: l, value }) => (
                <li key={l} className="rounded-2xl bg-mist p-4">
                  <Icon size={20} className="text-electric" aria-hidden />
                  <p className="mt-3 text-[13px] text-slate-text">{l}</p>
                  <p className="mt-0.5 font-bold text-night tabular">{value}</p>
                </li>
              ))}
            </ul>

            <section aria-labelledby="specs-heading">
              <h2 id="specs-heading" className="text-2xl font-extrabold text-night">Specifications</h2>
              <dl className="mt-5 grid overflow-hidden rounded-3xl border border-hairline sm:grid-cols-2">
                {specs.map(({ icon: Icon, label: l, value }, i) => (
                  <div key={l} className={cn("flex items-center gap-3 px-5 py-4", i > 0 && "border-t border-hairline", i === 1 && "sm:border-t-0", i % 2 === 1 && "sm:border-l")}>
                    <Icon size={18} className="shrink-0 text-electric" aria-hidden />
                    <dt className="text-[15px] text-slate-text">{l}</dt>
                    <dd className="ml-auto text-right font-semibold text-night tabular">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {car.description && (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="text-2xl font-extrabold text-night">From the seller</h2>
                <p className="mt-4 max-w-[70ch] whitespace-pre-line text-[17px] leading-relaxed text-slate-text">{car.description}</p>
              </section>
            )}

            {car.features?.length > 0 && (
              <section aria-labelledby="features-heading">
                <h2 id="features-heading" className="text-2xl font-extrabold text-night">Features</h2>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {car.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2.5 rounded-xl border border-hairline px-3.5 py-2.5 text-[15px] font-medium text-night">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-haze text-electric"><Check size={14} strokeWidth={3} aria-hidden /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="papers-heading"
              className={cn("rounded-3xl border p-6", car.paperVerified ? "border-verified/20 bg-verified-soft" : "border-hairline bg-mist")}>
              <h2 id="papers-heading" className="flex items-center gap-2.5 text-lg font-bold text-night">
                {car.paperVerified
                  ? <ShieldCheck size={22} className="text-verified" aria-hidden />
                  : <ShieldAlert size={22} className="text-warning" aria-hidden />}
                {car.paperVerified ? "Papers checked by CarHat" : "Papers not checked yet"}
              </h2>
              <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-slate-text">
                {car.paperVerified
                  ? "Our team has reviewed the registration certificate, tax token and fitness certificate the seller uploaded. Still see the originals in person before you pay."
                  : "The seller hasn't had their documents checked by CarHat. Ask to see the registration certificate, tax token and fitness certificate before you pay."}
              </p>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div id="contact" className="scroll-mt-36 rounded-3xl border border-hairline bg-white p-6 shadow-float">
              <p className="text-sm font-semibold text-slate-text">Asking price</p>
              <Price value={car.price} size="lg" className="mt-2 !text-electric" />
              <p className="mt-2 text-sm text-slate-text tabular">{formatTaka(car.price)}{hotDeal && !isSold ? " · below the market average for this model" : ""}</p>

              {!isSold && (
                <div className="mt-6">
                  <SellerContactCard listingId={car._id.toString()} sellerId={seller?._id?.toString() || ""} carTitle={car.title} />
                </div>
              )}

              {seller && (
                <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
                  <UserAvatar src={seller.avatar} name={sellerName} size={48} className="text-lg" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-bold text-night">
                      {sellerName}
                      {seller.isVerified && <BadgeCheck size={17} className="shrink-0 text-electric" aria-label="Verified account" />}
                    </p>
                    <p className="text-sm text-slate-text">
                      {seller.role === "dealer" || seller.dealershipName ? "Dealer" : "Private seller"}
                      {seller.createdAt && ` · on CarHat since ${new Date(seller.createdAt).getFullYear()}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-hairline bg-mist p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-night"><ShieldCheck size={18} className="text-electric" aria-hidden /> Buy safely</h2>
              <ul className="mt-3 space-y-2.5 text-[15px] text-slate-text">
                {[
                  "Don't send an advance to a seller you haven't met.",
                  "Meet in daylight, somewhere public.",
                  "Have a mechanic you trust inspect the car.",
                  "Match the chassis number with the registration papers.",
                  "Finish the BRTA name transfer before full payment.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2.5"><Check size={16} className="mt-1 shrink-0 text-electric" strokeWidth={3} aria-hidden />{tip}</li>
                ))}
              </ul>
              <Link href={`/contact?topic=report&listing=${encodeURIComponent(car.slug)}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-text hover:text-destructive">
                <Flag size={14} aria-hidden /> Report this listing
              </Link>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="defer-render mt-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Keep looking</p>
                <h2 id="related-heading" className="mt-2 text-[1.75rem] font-extrabold text-night md:text-4xl">You might also like</h2>
              </div>
              <Link href={brandPath || "/cars"} className="text-sm font-semibold text-electric hover:underline">
                {car.make ? `${car.make} prices in Bangladesh` : "More cars"}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((c) => (
                <CarCard key={c._id} car={c} sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 92vw" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Phones and tablets: keep price and the contact action in reach, above the bottom tab bar. */}
      {!isSold && (
        <div className="fixed inset-x-0 bottom-[calc(61px+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-4 border-t border-hairline bg-white/95 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
          <Price value={car.price} size="sm" className="!text-electric" />
          <a href="#contact" className="inline-flex h-11 items-center rounded-xl bg-electric px-5 text-[15px] font-semibold text-white shadow-glow">
            Contact seller
          </a>
        </div>
      )}
    </div>
  );
}
