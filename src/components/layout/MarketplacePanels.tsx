"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Bell, GitCompareArrows, Heart, Loader2, MessageSquare, ShieldCheck, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CarImage } from "@/components/CarImage";
import type { CarCardData } from "@/components/CarCard";
import { COMPARE_LIMIT, useMarketplace } from "@/context/MarketplaceContext";
import { cn, formatKm, formatLakh } from "@/lib/utils";

const FUEL: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", cng: "CNG", hybrid: "Hybrid", electric: "Electric", octane: "Octane" };
const GEAR: Record<string, string> = { automatic: "Automatic", manual: "Manual", "semi-automatic": "Semi-auto" };
const CONDITION: Record<string, string> = { new: "New", used: "Used", reconditioned: "Reconditioned" };

/** The navbar panels; which one is open lives in MarketplaceContext. */
export function MarketplacePanels({ unread }: { unread: number }) {
  const { panel, openPanel, closePanel } = useMarketplace();
  const onOpenChange = (open: boolean) => { if (!open) closePanel(); };

  return (
    <>
      <Dialog open={panel === "saved"} onOpenChange={onOpenChange}>
        <DialogContent side="right">
          <SavedPanel onCompare={() => openPanel("compare")} />
        </DialogContent>
      </Dialog>
      <Dialog open={panel === "compare"} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(60rem,calc(100vw-2rem))]">
          <ComparePanel />
        </DialogContent>
      </Dialog>
      <Dialog open={panel === "notifications"} onOpenChange={onOpenChange}>
        <DialogContent side="right">
          <NotificationsPanel unread={unread} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SignInPrompt({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-haze text-electric"><Heart size={24} aria-hidden /></span>
      <p className="mt-5 text-lg font-bold">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-text">{body}</p>
      <Button asChild className="mt-6"><Link href="/login?callbackUrl=%2F">Sign in</Link></Button>
      <Link href="/register" className="mt-3 text-sm font-semibold text-electric hover:underline">Create a free account</Link>
    </div>
  );
}

function SavedPanel({ onCompare }: { onCompare: () => void }) {
  const { status } = useSession();
  const { savedCars, favoriteIds, favoritesLoading, error, toggleFavorite, pendingIds, compareCars, toggleCompare } = useMarketplace();
  const cars = savedCars.filter((car) => favoriteIds.includes(car._id));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Saved cars</DialogTitle>
        <DialogDescription>{cars.length ? `${cars.length} ${cars.length === 1 ? "car" : "cars"} on your wishlist` : "Tap the heart on any car to keep it here."}</DialogDescription>
      </DialogHeader>
      <div className="grow overflow-y-auto">
        {status !== "authenticated" ? (
          status === "loading" ? <PanelLoading /> : <SignInPrompt title="Keep a wishlist" body="Sign in to save cars and come back to them on any device." />
        ) : favoritesLoading && !cars.length ? (
          <PanelLoading />
        ) : cars.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold">Nothing saved yet</p>
            <p className="mt-1 text-sm text-slate-text">Browse cars and tap the heart to build a shortlist.</p>
            <Button asChild variant="secondary" className="mt-5"><Link href="/cars">Browse cars</Link></Button>
          </div>
        ) : (
          <ul className="space-y-2 p-4">
            {cars.map((car) => {
              const comparing = compareCars.some((c) => c._id === car._id);
              return (
                <li key={car._id} className="flex gap-3 rounded-2xl border border-hairline p-2.5">
                  <Link href={`/cars/${car.slug}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <CarImage src={car.images?.[0]} alt={car.title} sizes="112px" />
                  </Link>
                  <div className="min-w-0 grow">
                    <Link href={`/cars/${car.slug}`} className="line-clamp-1 text-sm font-semibold hover:text-electric">{car.title}</Link>
                    <p className="price-tag mt-1 text-base text-electric">{formatLakh(car.price)}</p>
                    {car.status === "sold" && <p className="text-xs font-semibold text-slate-text">Sold</p>}
                    <div className="mt-1.5 flex gap-1">
                      <button type="button" onClick={() => toggleCompare(car)} aria-pressed={comparing}
                        className={cn("inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold", comparing ? "bg-haze text-electric" : "text-slate-text hover:bg-mist")}>
                        <GitCompareArrows size={14} aria-hidden /> {comparing ? "Comparing" : "Compare"}
                      </button>
                      <button type="button" onClick={() => void toggleFavorite(car._id)} disabled={pendingIds.includes(car._id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-text hover:bg-mist disabled:opacity-50" aria-label={`Remove ${car.title}`}>
                        <Trash2 size={14} aria-hidden /> Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {error && <p role="alert" className="mx-4 mb-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-destructive">{error}</p>}
      </div>
      {compareCars.length > 1 && (
        <div className="border-t border-hairline p-4">
          <Button className="w-full" onClick={onCompare}>Compare {compareCars.length} cars <ArrowRight size={16} aria-hidden /></Button>
        </div>
      )}
    </>
  );
}

function PanelLoading() {
  return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-electric" aria-label="Loading" /></div>;
}

type Row = { label: string; value: (car: CarCardData) => React.ReactNode; best?: (cars: CarCardData[]) => string | undefined };

const pick = (cars: CarCardData[], score: (c: CarCardData) => number | undefined) => {
  const scored = cars.filter((c) => score(c) !== undefined);
  if (scored.length < 2) return undefined;
  return scored.reduce((a, b) => (score(b)! < score(a)! ? b : a))._id;
};

const ROWS: Row[] = [
  { label: "Price", value: (c) => <span className="price-tag text-electric">{formatLakh(c.price)}</span>, best: (cars) => pick(cars, (c) => c.price) },
  { label: "Year", value: (c) => c.year ?? "—", best: (cars) => pick(cars, (c) => (c.year ? -c.year : undefined)) },
  { label: "Mileage", value: (c) => (c.mileage !== undefined ? formatKm(c.mileage) : "—"), best: (cars) => pick(cars, (c) => c.mileage) },
  { label: "Fuel", value: (c) => (c.fuelType ? FUEL[c.fuelType] || c.fuelType : "—") },
  { label: "Transmission", value: (c) => (c.transmission ? GEAR[c.transmission] || c.transmission : "—") },
  { label: "Condition", value: (c) => (c.condition ? CONDITION[c.condition] || c.condition : "—") },
  { label: "Location", value: (c) => c.location || "—" },
  { label: "Papers", value: (c) => (c.paperVerified ? <span className="inline-flex items-center gap-1 font-semibold text-verified"><ShieldCheck size={14} aria-hidden /> Verified</span> : "Not yet checked") },
  { label: "Seller", value: (c) => c.seller?.dealershipName || c.seller?.name || "—" },
];

function ComparePanel() {
  const { compareCars, toggleCompare, clearCompare, openPanel, closePanel } = useMarketplace();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Car comparison</DialogTitle>
        <DialogDescription>Up to {COMPARE_LIMIT} cars side by side. The best figure in each row is highlighted.</DialogDescription>
      </DialogHeader>
      <div className="grow overflow-auto">
        {compareCars.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-haze text-electric"><GitCompareArrows size={24} aria-hidden /></span>
            <p className="mt-5 text-lg font-bold">Pick cars to compare</p>
            <p className="mt-1.5 max-w-sm text-sm text-slate-text">Tap the compare button on any car, or from your saved cars, and they will line up here.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild onClick={closePanel}><Link href="/cars">Browse cars</Link></Button>
              <Button variant="secondary" onClick={() => openPanel("saved")}>Open saved cars</Button>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[34rem] table-fixed border-collapse text-sm">
            <caption className="sr-only">Comparison of selected cars</caption>
            <thead>
              <tr>
                <th scope="col" className="w-32 p-4 text-left align-bottom text-xs font-semibold uppercase tracking-[0.12em] text-slate-text">Car</th>
                {compareCars.map((car) => (
                  <th key={car._id} scope="col" className="p-3 text-left align-top font-normal">
                    <div className="relative aspect-[1.5] overflow-hidden rounded-xl bg-mist">
                      <CarImage src={car.images?.[0]} alt="" sizes="220px" />
                      <button type="button" onClick={() => toggleCompare(car)} className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-text shadow-sm hover:text-night" aria-label={`Remove ${car.title} from comparison`}>
                        <X size={15} aria-hidden />
                      </button>
                    </div>
                    <Link href={`/cars/${car.slug}`} className="mt-2 line-clamp-2 block font-semibold text-night hover:text-electric">{car.title}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const best = row.best?.(compareCars);
                return (
                  <tr key={row.label} className="border-t border-hairline">
                    <th scope="row" className="p-4 text-left font-medium text-slate-text">{row.label}</th>
                    {compareCars.map((car) => (
                      <td key={car._id} className={cn("px-3 py-3", best === car._id && "bg-haze/70 font-semibold")}>
                        {row.value(car)}
                        {best === car._id && <span className="ml-2 inline-flex rounded-full bg-electric px-2 py-0.5 align-middle text-xs font-semibold text-white">Best</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {compareCars.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-4">
          <button type="button" onClick={clearCompare} className="text-sm font-semibold text-slate-text hover:text-night">Clear all</button>
          {compareCars.length < COMPARE_LIMIT && <p className="text-sm text-slate-text">You can add {COMPARE_LIMIT - compareCars.length} more</p>}
        </div>
      )}
    </>
  );
}

function NotificationsPanel({ unread }: { unread: number }) {
  const { status } = useSession();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Notifications</DialogTitle>
        <DialogDescription>Messages from buyers and sellers.</DialogDescription>
      </DialogHeader>
      <div className="grow overflow-y-auto p-4">
        {status !== "authenticated" ? (
          status === "loading" ? <PanelLoading /> : <SignInPrompt title="Stay in the loop" body="Sign in to get messages from sellers and buyers as they arrive." />
        ) : unread > 0 ? (
          <Link href="/dashboard/messages" className="flex items-center gap-3 rounded-2xl border border-electric/20 bg-haze/60 p-4 hover:bg-haze">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric text-white"><MessageSquare size={20} aria-hidden /></span>
            <span className="grow">
              <span className="block font-semibold">{unread} unread {unread === 1 ? "message" : "messages"}</span>
              <span className="block text-sm text-slate-text">Open your inbox to reply</span>
            </span>
            <ArrowRight size={18} className="text-electric" aria-hidden />
          </Link>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-haze text-electric"><Bell size={24} aria-hidden /></span>
            <p className="mt-5 font-semibold">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-slate-text">New messages will show here.</p>
            <Button asChild variant="secondary" className="mt-5"><Link href="/dashboard/messages">Go to messages</Link></Button>
          </div>
        )}
      </div>
    </>
  );
}
