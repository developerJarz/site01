"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Bot, Sparkles } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { Badge } from "@/components/ui/badge";
import { describeIntent, intentToParams, parseCarIntent } from "@/lib/car-intent";
import { formatLakh } from "@/lib/utils";
import { AI_DEFAULT } from "./data";
import { Reveal } from "@/components/ui/motion";

interface Match { _id: string; slug: string; title: string; price: number; year?: number; location?: string; images?: string[] }

type Reply =
  | { kind: "default" }
  | { kind: "loading"; prompt: string }
  | { kind: "results"; prompt: string; summary: string; href: string; cars: Match[] }
  | { kind: "error"; prompt: string };

const SUGGESTIONS = ["Hybrid sedan under 25 lakh", "7 seater in Dhaka", "Luxury car 1 to 2 crore"];

import type { HomeSectionConfig } from "@/lib/site-config";

export function AiAssistant({ config }: { config?: HomeSectionConfig }) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<Reply>({ kind: "default" });
  const request = useRef<AbortController | null>(null);

  const eyebrow = config?.eyebrow || "AI Car Assistant · Beta";
  const title = config?.title || (
    <>
      Find your perfect car with <span className="bg-gradient-to-r from-[#5aa9ff] to-[#9fd0ff] bg-clip-text text-transparent">AI</span>
    </>
  );
  const subtitle = config?.subtitle || "Describe what you need in plain words: budget, body type, fuel, city. The assistant turns it into a search across every live listing and shows you the best matches.";

  const ask = async (text: string) => {
    const prompt = text.trim();
    if (!prompt) return;
    setInput("");
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setReply({ kind: "loading", prompt });
    const intent = parseCarIntent(prompt);
    const params = intentToParams(intent);
    // Nothing recognisable: fall back to a text search so the reply is still useful.
    if (![...params.keys()].length) params.set("q", prompt.slice(0, 60));
    try {
      const res = await fetch(`/api/listings/search?${params}&sort=popular`, { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setReply({
        kind: "results", prompt,
        summary: params.has("q") ? `cars matching “${prompt}”` : describeIntent(intent),
        href: `/cars?${params}`,
        cars: (data.listings || []).slice(0, 3),
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setReply({ kind: "error", prompt });
    }
  };

  const prompt = reply.kind === "default" ? AI_DEFAULT.prompt : reply.prompt;

  return (
    <section aria-labelledby="ai-heading" className="relative isolate overflow-hidden bg-night text-white">
      <div className="absolute -top-40 left-1/4 -z-10 size-[36rem] rounded-full bg-electric/30 blur-[120px]" aria-hidden />
      <div className="absolute -bottom-40 right-0 -z-10 size-[28rem] rounded-full bg-electric-light/20 blur-[120px]" aria-hidden />
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal>
          <Badge variant="glass" className="border-white/15 bg-white/10 text-white"><Sparkles aria-hidden /> {eyebrow}</Badge>
          <h2 id="ai-heading" className="mt-5 text-4xl font-extrabold leading-[1.08] md:text-[3.1rem]">
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
            {subtitle}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => void ask(s)} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_40px_100px_-40px_rgb(14_106_168/0.6)] backdrop-blur-2xl">
            <div className="rounded-[22px] bg-white text-night">
              <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-electric-light text-white"><Bot size={20} aria-hidden /></span>
                <span className="grow">
                  <span className="block text-sm font-bold">CarHat Assistant</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-text"><span className="size-1.5 rounded-full bg-[#22c55e]" aria-hidden /> Searching live listings</span>
                </span>
              </div>

              <div className="min-h-[22rem] space-y-4 p-5" aria-live="polite">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-md bg-electric px-4 py-2.5 text-sm font-medium text-white">{prompt}</p>
                </div>
                  <motion.div key={reply.kind === "default" ? "default" : `${reply.kind}-${prompt}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className="max-w-[92%] rounded-2xl rounded-bl-md bg-mist p-4 text-sm">
                    {reply.kind === "loading" ? (
                      <span className="flex items-center gap-1.5 py-1" aria-label="Thinking">
                        {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-electric/60" style={{ animationDelay: `${i * 120}ms` }} />)}
                      </span>
                    ) : reply.kind === "error" ? (
                      <p>I couldn&apos;t search right now. <Link href="/cars" className="font-semibold text-electric hover:underline">Browse all cars</Link> instead.</p>
                    ) : reply.kind === "default" ? (
                      <>
                        <p>Great choice. For an SUV under 40 lakh, these are the three I&apos;d look at first:</p>
                        <ol className="mt-3 space-y-2">
                          {AI_DEFAULT.picks.map((pick, i) => (
                            <li key={pick.model}>
                              <Link href={`/cars?make=${encodeURIComponent(pick.make)}&model=${encodeURIComponent(pick.model)}`}
                                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-soft transition-colors hover:text-electric">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-haze text-xs font-bold text-electric">{i + 1}</span>
                                <span className="grow">
                                  <span className="block font-semibold">{pick.make} {pick.model}</span>
                                  <span className="block text-xs text-slate-text">{pick.note}</span>
                                </span>
                                <ArrowRight size={16} aria-hidden />
                              </Link>
                            </li>
                          ))}
                        </ol>
                        <Link href="/cars?category=suv&maxPrice=4000000" className="mt-3 inline-flex items-center gap-1 font-semibold text-electric hover:underline">
                          See every SUV under 40 lakh <ArrowRight size={14} aria-hidden />
                        </Link>
                      </>
                    ) : reply.cars.length === 0 ? (
                      <p>
                        No listings match {reply.summary} right now. Try widening the budget, or{" "}
                        <Link href={reply.href} className="font-semibold text-electric hover:underline">open the search</Link> and adjust the filters.
                      </p>
                    ) : (
                      <>
                        <p>Here are the top matches for {reply.summary}:</p>
                        <ul className="mt-3 space-y-2">
                          {reply.cars.map((car) => (
                            <li key={car._id}>
                              <Link href={`/cars/${car.slug}`} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-soft transition-colors hover:text-electric">
                                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-mist"><CarImage src={car.images?.[0]} alt="" sizes="64px" /></span>
                                <span className="min-w-0 grow">
                                  <span className="block truncate font-semibold">{car.title}</span>
                                  <span className="block truncate text-xs text-slate-text">{[car.year, car.location].filter(Boolean).join(" · ")}</span>
                                </span>
                                <span className="price-tag shrink-0 pr-1 text-electric">{formatLakh(car.price)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link href={reply.href} className="mt-3 inline-flex items-center gap-1 font-semibold text-electric hover:underline">
                          See all results <ArrowRight size={14} aria-hidden />
                        </Link>
                      </>
                    )}
                  </motion.div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); void ask(input); }} className="flex items-center gap-2 border-t border-hairline p-3">
                <label htmlFor="ai-input" className="sr-only">Describe the car you want</label>
                <input id="ai-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={200} autoComplete="off"
                  placeholder="e.g. Hybrid SUV under 35 lakh in Dhaka" className="h-11 min-w-0 grow rounded-xl bg-mist px-4 text-base outline-none placeholder:text-slate-text/80 focus-visible:ring-2 focus-visible:ring-electric" />
                <button type="submit" disabled={!input.trim() || reply.kind === "loading"} aria-label="Ask the assistant"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric text-white transition-colors hover:bg-electric-deep disabled:opacity-40">
                  <ArrowUp size={18} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
