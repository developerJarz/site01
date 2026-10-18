"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BUDGETS, CATEGORIES, CONDITIONS, FUELS, TRANSMISSIONS } from "./data";
import { Reveal } from "@/components/ui/motion";

const CITIES = ["Dhaka", "Chattogram", "Gazipur", "Narayanganj", "Sylhet", "Khulna", "Rajshahi", "Cumilla", "Barishal", "Rangpur", "Mymensingh", "Bogura"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1999 }, (_, i) => String(THIS_YEAR - i));

import type { HomeSectionConfig } from "@/lib/site-config";

export function SmartSearch({ makes, modelsByMake, budgetCounts, config }: {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  budgetCounts: Record<string, number>;
  config?: HomeSectionConfig;
}) {
  const router = useProgressRouter();
  const id = useId();
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState({
    make: "", model: "", year: "", budget: "", location: "", fuelType: "",
    condition: "", transmission: "", category: "", verified: false,
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value, ...(key === "make" ? { model: "" } : {}) }));

  const models = useMemo(() => modelsByMake[form.make.toLowerCase()] ?? [], [form.make, modelsByMake]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const key of ["make", "model", "year", "location", "fuelType", "condition", "transmission", "category"] as const) {
      const value = form[key].trim();
      if (value) params.set(key, value);
    }
    if (form.budget) {
      const [min, max] = form.budget.split("-");
      if (min && min !== "0") params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    if (form.verified) params.set("verified", "1");
    const qs = params.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  };

  const budgetHref = (value: string) => {
    const [min, max] = value.split("-");
    const p = new URLSearchParams();
    if (min && min !== "0") p.set("minPrice", min);
    if (max) p.set("maxPrice", max);
    return `/cars?${p}`;
  };

  return (
    <section id="search" aria-labelledby={`${id}-title`} className="relative z-20 mx-auto max-w-[1320px] px-4 pt-6 sm:px-6 md:pt-8 lg:px-8">
      <Reveal y={40}>
        <form onSubmit={submit} className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_30px_80px_-30px_rgb(10_72_152/0.35)] backdrop-blur-2xl sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${id}-title`} className="flex items-center gap-2.5 text-lg font-bold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-electric text-white"><Search size={18} aria-hidden /></span>
              {config?.title || "Smart car search"}
            </h2>
            <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} aria-controls={`${id}-advanced`}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-electric hover:bg-haze">
              <SlidersHorizontal size={16} aria-hidden /> Advanced Search
              <ChevronDown size={16} className={cn("transition-transform", advanced && "rotate-180")} aria-hidden />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
            <Field label="Brand" htmlFor={`${id}-make`}>
              <Select id={`${id}-make`} value={form.make} onChange={set("make")}>
                <option value="">Any brand</option>
                {makes.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Model" htmlFor={`${id}-model`}>
              <input id={`${id}-model`} list={`${id}-models`} value={form.model} onChange={set("model")}
                placeholder={form.make ? "Any model" : "e.g. Axio"} className="search-input" autoComplete="off" />
              <datalist id={`${id}-models`}>{models.map((m) => <option key={m} value={m} />)}</datalist>
            </Field>
            <Field label="Year" htmlFor={`${id}-year`}>
              <Select id={`${id}-year`} value={form.year} onChange={set("year")}>
                <option value="">Any year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </Field>
            <Field label="Price Range" htmlFor={`${id}-budget`}>
              <Select id={`${id}-budget`} value={form.budget} onChange={set("budget")}>
                <option value="">Any price</option>
                {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </Select>
            </Field>
            <Field label="Location" htmlFor={`${id}-location`}>
              <Select id={`${id}-location`} value={form.location} onChange={set("location")}>
                <option value="">All Bangladesh</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Fuel Type" htmlFor={`${id}-fuel`}>
              <Select id={`${id}-fuel`} value={form.fuelType} onChange={set("fuelType")}>
                <option value="">Any fuel</option>
                {FUELS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </Field>
            <Button type="submit" size="lg" className="col-span-2 mt-1 h-[52px] self-end md:col-span-3 lg:col-span-1 lg:mt-0">
              <Search size={18} aria-hidden /> Search Cars
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {advanced && (
              <motion.div id={`${id}-advanced`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-hairline pt-4 md:grid-cols-4">
                  <Field label="Body type" htmlFor={`${id}-category`}>
                    <Select id={`${id}-category`} value={form.category} onChange={set("category")}>
                      <option value="">Any body type</option>
                      {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Condition" htmlFor={`${id}-condition`}>
                    <Select id={`${id}-condition`} value={form.condition} onChange={set("condition")}>
                      <option value="">Any condition</option>
                      {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Transmission" htmlFor={`${id}-gear`}>
                    <Select id={`${id}-gear`} value={form.transmission} onChange={set("transmission")}>
                      <option value="">Any gearbox</option>
                      {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </Field>
                  <label className="col-span-2 flex min-h-[52px] cursor-pointer items-center gap-3 self-end rounded-2xl border border-hairline bg-white px-4 text-sm font-semibold md:col-span-1">
                    <input type="checkbox" checked={form.verified} onChange={set("verified")} className="size-4 accent-electric" />
                    Paper Verified only
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex items-center gap-3 border-t border-hairline pt-4">
            <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-slate-text">By budget</p>
            <ul className="scrollbar-none -mr-5 flex gap-2 overflow-x-auto pr-5 sm:mr-0 sm:pr-0">
              {BUDGETS.map((b) => {
                const count = budgetCounts[b.value] || 0;
                return (
                  <li key={b.value} className="shrink-0">
                    <Link href={budgetHref(b.value)} className="flex h-9 items-center gap-1.5 rounded-full border border-hairline bg-white px-3.5 text-[13px] font-semibold text-night transition-colors hover:border-electric/40 hover:text-electric">
                      {b.label}
                      {count > 0 && <span className="text-slate-text tabular">· {count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </form>
      </Reveal>
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="pl-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-text">{label}</label>
      {children}
    </div>
  );
}

function Select(props: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className="search-input appearance-none pr-9" />
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
    </div>
  );
}
