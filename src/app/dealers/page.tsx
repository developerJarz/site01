import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Car, MapPin, MessageSquare, ShieldCheck, Store } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { CONTAINER, EmptyState, PageHero } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/dealers");

// Rebuilt at most every five minutes.
export const revalidate = 300;

type Dealer = { _id: string; name: string; avatar?: string; dealershipName?: string; city?: string; isVerified?: boolean; createdAt: string; live: number; verified: number };

async function getDealers(): Promise<Dealer[]> {
  try {
    await connectToDatabase();
    const [dealers, stock] = await Promise.all([
      User.find({ role: "dealer" }).select("name avatar dealershipName city isVerified createdAt").lean(),
      Listing.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$sellerId", live: { $sum: 1 }, verified: { $sum: { $cond: ["$paperVerified", 1, 0] } } } },
      ]),
    ]);
    const bySeller = new Map(stock.map((s) => [String(s._id), s]));
    return JSON.parse(JSON.stringify(dealers))
      .map((d: Dealer) => ({ ...d, live: bySeller.get(String(d._id))?.live || 0, verified: bySeller.get(String(d._id))?.verified || 0 }))
      .sort((a: Dealer, b: Dealer) => b.live - a.live || Number(!!b.isVerified) - Number(!!a.isVerified));
  } catch (error) {
    console.error("Dealers failed to load:", error);
    return [];
  }
}

const BENEFITS = [
  { icon: Store, title: "Your showroom page", body: "All your live stock in one link to share with customers." },
  { icon: ShieldCheck, title: "Paper Verified badges", body: "Upload papers once and buyers trust your cars from the first look." },
  { icon: MessageSquare, title: "One inbox for leads", body: "Every enquiry from every listing, with the car attached." },
  { icon: BarChart3, title: "Views, saves and chats", body: "See which cars buyers are looking at from your dashboard." },
];

export default async function DealersPage() {
  const dealers = await getDealers();
  const withStock = dealers.filter((d) => d.live > 0);
  const shown = withStock.length ? withStock : dealers;

  return (
    <>
      <PageHero
        eyebrow="Dealers"
        title={<>Trusted <span className="text-gradient-electric">car dealers</span> across Bangladesh</>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dealers" }]}
        description="Browse showrooms and their live stock, or bring your dealership to CarHat. Listing is free."
        actions={<Button asChild size="lg"><Link href="#partner">Become a dealer partner <ArrowRight size={17} aria-hidden /></Link></Button>}
      />

      <section aria-labelledby="directory-heading" className={cn(CONTAINER, "py-12 md:py-16")}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Directory</p>
            <h2 id="directory-heading" className="mt-2 text-[1.75rem] font-extrabold md:text-4xl">Dealers on CarHat</h2>
          </div>
          <p className="text-sm text-slate-text tabular">{dealers.length.toLocaleString("en-IN")} dealers · {withStock.reduce((n, d) => n + d.live, 0).toLocaleString("en-IN")} cars in stock</p>
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={Store} title="Dealers are joining now" body="Be one of the first showrooms on CarHat BD."
            action={<Button asChild><Link href="/register">Register as a dealer</Link></Button>} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((d) => {
              const name = d.dealershipName || d.name;
              return (
                <li key={d._id} className="flex flex-col rounded-3xl border border-hairline bg-white p-6 shadow-soft transition-[border-color,box-shadow] hover:border-electric/20 hover:shadow-float">
                  <div className="flex items-center gap-4">
                    <UserAvatar src={d.avatar} name={name} size={56} className="rounded-2xl text-xl shadow-glow" />
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-1.5 truncate text-lg font-bold">
                        <span className="truncate">{name}</span>
                        {d.isVerified && <BadgeCheck size={18} className="shrink-0 text-electric" aria-label="Verified dealer" />}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-slate-text"><MapPin size={14} aria-hidden /> {d.city || "Bangladesh"}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-mist p-3 text-center">
                    <div><dt className="text-[11px] font-semibold text-slate-text">Live cars</dt><dd className="mt-0.5 font-extrabold tabular">{d.live}</dd></div>
                    <div><dt className="text-[11px] font-semibold text-slate-text">Verified</dt><dd className="mt-0.5 font-extrabold tabular">{d.verified}</dd></div>
                    <div><dt className="text-[11px] font-semibold text-slate-text">Since</dt><dd className="mt-0.5 font-extrabold tabular">{new Date(d.createdAt).getFullYear()}</dd></div>
                  </dl>
                  <Button asChild variant={d.live ? "default" : "secondary"} className="mt-5 w-full" disabled={!d.live}>
                    <Link href={`/cars?seller=${d._id}`}><Car size={16} aria-hidden /> {d.live ? `See ${d.live} ${d.live === 1 ? "car" : "cars"}` : "No cars listed yet"}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="partner" aria-labelledby="partner-heading" className="scroll-mt-32 bg-mist py-16 md:py-24">
        <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-2 lg:items-center")}>
          <div>
            <p className="eyebrow">For dealers</p>
            <h2 id="partner-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">Sell more cars with CarHat</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-slate-text">Create a dealer account, add your showroom name, and start listing. It&apos;s free, with no commission on your sales.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button asChild size="lg"><Link href="/register">Create a dealer account</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/contact?topic=dealer">Talk to our team</Link></Button>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-3xl border border-hairline bg-white p-6 shadow-soft">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={22} aria-hidden /></span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-text">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
