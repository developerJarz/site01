"use client";

import { useEffect, useRef, useState } from "react";
import { PageLoader } from "@/components/ui/brand-loader";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, Clock, FileCheck2, FileText, ImagePlus, Loader2, Lock,
  RotateCcw, ShieldCheck, Sparkles, Upload, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, CONTAINER, PageHero } from "@/components/ui/page";
import { BRANDS, CONDITIONS, FUELS, MORE_MAKES, TRANSMISSIONS } from "@/components/home/data";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn, formatLakh, formatTaka } from "@/lib/utils";
import { validateImageFile } from "@/lib/image-upload";
import { uploadFile, usePhotoUploads } from "@/lib/upload-client";
import { ContactNumbersPrompt } from "@/components/ContactNumbersPrompt";

const MAKES = [...new Set([...BRANDS.map((b) => b.name), ...MORE_MAKES, "Subaru"])].sort((a, b) => a.localeCompare(b));
const FEATURE_OPTIONS = [
  "Push start", "Keyless entry", "Reverse camera", "360° camera", "Navigation", "Sunroof", "Leather seats", "Climate control",
  "Cruise control", "Alloy wheels", "Fog lights", "Bluetooth audio", "Android Auto / CarPlay", "Lane assist", "ABS", "Multiple airbags",
];
const STEPS = ["Car details", "Price & story", "Photos & papers"];

export default function SellCarPage() {
  const { status } = useSession();
  const { settings } = useSiteSettings();
  const maxPhotos = settings.maxImagesPerListing || 10;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ status: string; slug: string } | null>(null);

  // Photos upload in the background as soon as they're added (see lib/upload-client).
  const uploads = usePhotoUploads(maxPhotos);
  const photos = uploads.photos;
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);
  // The submit handler awaits uploads, so it reads photo state through a ref rather than a stale closure.
  const latestPhotos = useRef(photos);
  useEffect(() => { latestPhotos.current = photos; }, [photos]);

  const [form, setForm] = useState({
    make: "", model: "", year: "", price: "", mileage: "", condition: "used", description: "",
    fuelType: "petrol", transmission: "automatic", engineSize: "", color: "", location: "Dhaka", features: [] as string[],
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const goTo = (n: number) => {
    setError("");
    setStep(n);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading") {
    return <PageLoader />;
  }

  if (status === "unauthenticated") {
    return (
      <>
        <PageHero eyebrow="Sell your car" title={<>Sell your car to <span className="text-gradient-electric">serious buyers</span></>} center
          description="Post your car in about five minutes. It's free, and buyers across all 64 districts can reach you." />
        <div className={cn(CONTAINER, "py-14")}>
          <div className="mx-auto max-w-lg rounded-3xl border border-hairline bg-white p-8 text-center shadow-float">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-haze text-electric"><Lock size={24} aria-hidden /></span>
            <h2 className="mt-5 text-2xl font-extrabold">Sign in to post your car</h2>
            <p className="mt-2 text-slate-text">You need a free account so buyers can message you and you can manage your listing.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button asChild size="lg"><Link href="/login?callbackUrl=%2Fsell">Sign in</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/register">Create account</Link></Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const year = Number(form.year);
  const thisYear = new Date().getFullYear();
  const step1Error = !form.make ? "Choose the make." : !form.model.trim() ? "Enter the model." : !(year >= 1950 && year <= thisYear + 1) ? "Enter a valid year." : "";
  const step2Error = !(Number(form.price) >= 10000) ? "Enter your asking price in taka." : !(Number(form.mileage) >= 0 && form.mileage !== "") ? "Enter the mileage." : form.description.trim().length < 20 ? "Write at least a sentence or two about the car." : "";

  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    try { files.forEach(validateImageFile); }
    catch (error) { setError((error as Error).message); return; }
    setError("");
    uploads.add(files);
  };
  const addDocs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setDocFiles((d) => [...d, ...files].slice(0, 5));
  };
  const photosFailedNow = () => latestPhotos.current.some((p) => p.status === "error");
  const currentPhotoUrls = () => latestPhotos.current.flatMap((p) => (p.url ? [p.url] : []));
  const toggleFeature = (f: string) =>
    setForm((s) => ({ ...s, features: s.features.includes(f) ? s.features.filter((x) => x !== f) : [...s.features, f] }));

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      // Most photos are usually uploaded by now; wait only for any still on their way.
      setProgress("photos");
      await uploads.settled();
      if (photosFailedNow()) {
        throw new Error("Some photos didn't upload. Tap “Retry” on the red photos (or remove them), then post again.");
      }
      const images = currentPhotoUrls();
      const documents: string[] = [];
      if (docFiles.length) {
        setProgress("Uploading papers securely…");
        for (const file of docFiles) documents.push(...(await uploadFile(file, "documents")));
      }
      setProgress("Publishing your listing…");
      const res = await axios.post("/api/listings", {
        ...form,
        price: Number(form.price),
        mileage: Number(form.mileage),
        year,
        engineSize: Number(form.engineSize || 1500),
        images,
        documents,
      }, { timeout: 60_000 });
      setResult({ status: res.data.status || res.data.listing?.status || "active", slug: res.data.listing?.slug });
      setStep(4);
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: any) {
      setError(err.response?.data?.error || (err.code === "ECONNABORTED" ? "Publishing took too long. Check your connection and try again." : err.message) || "Couldn't post your car. Check your connection and try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Sell your car"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sell your car" }]}
        title={<>Sell your car to <span className="text-gradient-electric">serious buyers</span></>}
        description="Three quick steps. Add your papers for the Paper Verified badge, and buyers trust your listing from day one."
      />

      <div ref={formTop} className={cn(CONTAINER, "scroll-mt-32 py-10 md:py-14")}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            {step < 4 && (
              <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Progress">
                {STEPS.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  return (
                    <li key={label} aria-current={step === n ? "step" : undefined}>
                      <span className={cn("block h-1.5 rounded-full transition-colors", done || step === n ? "bg-electric" : "bg-hairline")} />
                      <span className={cn("mt-2 flex items-center gap-1.5 text-[13px] font-semibold", step === n ? "text-night" : "text-slate-text")}>
                        {done ? <Check size={14} className="text-electric" aria-hidden /> : <span className="tabular">{n}.</span>} {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {error && <Alert className="mb-5">{error}</Alert>}

            {step < 4 && <ContactNumbersPrompt className="mb-5" description="Buyers will call or WhatsApp you about this car. Save your numbers once and every listing you post uses them." />}

            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-soft md:p-8">
              {step === 1 && (
                <fieldset className="animate-in">
                  <legend className="text-xl font-extrabold">Tell us about the car</legend>
                  <p className="mt-1 text-[15px] text-slate-text">Make, model and year make up your listing&apos;s title.</p>
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="s-make" className="field-label">Make <span className="text-destructive">*</span></label>
                      <select id="s-make" className="field" value={form.make} onChange={set("make")} required>
                        <option value="">Choose a make</option>
                        {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="s-model" className="field-label">Model <span className="text-destructive">*</span></label>
                      <input id="s-model" className="field" placeholder="e.g. Axio, Premio, Vezel" value={form.model} onChange={set("model")} maxLength={60} required />
                    </div>
                    <div>
                      <label htmlFor="s-year" className="field-label">Model year <span className="text-destructive">*</span></label>
                      <input id="s-year" type="number" inputMode="numeric" className="field" placeholder={`e.g. ${thisYear - 6}`} min={1950} max={thisYear + 1} value={form.year} onChange={set("year")} required />
                    </div>
                    <div>
                      <label htmlFor="s-condition" className="field-label">Condition</label>
                      <select id="s-condition" className="field" value={form.condition} onChange={set("condition")}>
                        {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="s-fuel" className="field-label">Fuel</label>
                      <select id="s-fuel" className="field" value={form.fuelType} onChange={set("fuelType")}>
                        {FUELS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="s-gear" className="field-label">Transmission</label>
                      <select id="s-gear" className="field" value={form.transmission} onChange={set("transmission")}>
                        {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="s-engine" className="field-label">Engine (cc)</label>
                      <input id="s-engine" type="number" inputMode="numeric" className="field" placeholder="e.g. 1500" value={form.engineSize} onChange={set("engineSize")} />
                    </div>
                    <div>
                      <label htmlFor="s-color" className="field-label">Colour</label>
                      <input id="s-color" className="field" placeholder="e.g. Pearl white" value={form.color} onChange={set("color")} maxLength={40} />
                    </div>
                  </div>
                  <StepActions>
                    <span />
                    <Button size="lg" onClick={() => (step1Error ? setError(step1Error) : goTo(2))}>Continue <ArrowRight size={17} aria-hidden /></Button>
                  </StepActions>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="animate-in">
                  <legend className="text-xl font-extrabold">Price and description</legend>
                  <p className="mt-1 text-[15px] text-slate-text">A fair price and an honest description sell cars fastest.</p>
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="s-price" className="field-label">Asking price (৳) <span className="text-destructive">*</span></label>
                      <input id="s-price" type="number" inputMode="numeric" className="field" placeholder="e.g. 2450000" value={form.price} onChange={set("price")} aria-describedby="s-price-hint" />
                      <p id="s-price-hint" className="mt-1.5 text-[13px] font-semibold text-electric tabular" aria-live="polite">
                        {Number(form.price) > 0 ? `${formatLakh(Number(form.price))} · ${formatTaka(Number(form.price))}` : "Enter the full amount in taka"}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="s-mileage" className="field-label">Mileage (km) <span className="text-destructive">*</span></label>
                      <input id="s-mileage" type="number" inputMode="numeric" className="field" placeholder="e.g. 62000" value={form.mileage} onChange={set("mileage")} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="s-location" className="field-label">Where is the car?</label>
                      <input id="s-location" className="field" placeholder="e.g. Gulshan, Dhaka" value={form.location} onChange={set("location")} maxLength={120} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="s-desc" className="field-label">Description <span className="text-destructive">*</span></label>
                      <textarea id="s-desc" rows={5} className="field resize-y" maxLength={5000} value={form.description} onChange={set("description")}
                        placeholder="Service history, owners, accidents, recent work, why you're selling…" />
                      <p className="mt-1.5 text-right text-xs text-slate-text tabular">{form.description.length}/5000</p>
                    </div>
                  </div>
                  <fieldset className="mt-4">
                    <legend className="field-label">Features <span className="font-normal text-slate-text">(optional)</span></legend>
                    <div className="flex flex-wrap gap-2">
                      {FEATURE_OPTIONS.map((f) => {
                        const on = form.features.includes(f);
                        return (
                          <button key={f} type="button" aria-pressed={on} onClick={() => toggleFeature(f)}
                            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                              on ? "border-electric bg-haze text-electric-deep" : "border-hairline text-slate-text hover:border-electric/40 hover:text-night")}>
                            {on && <Check size={14} aria-hidden />} {f}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <StepActions>
                    <Button variant="secondary" size="lg" onClick={() => goTo(1)}><ArrowLeft size={17} aria-hidden /> Back</Button>
                    <Button size="lg" onClick={() => (step2Error ? setError(step2Error) : goTo(3))}>Continue <ArrowRight size={17} aria-hidden /></Button>
                  </StepActions>
                </fieldset>
              )}

              {step === 3 && (
                <div className="animate-in space-y-8">
                  <section aria-labelledby="photos-heading">
                    <h2 id="photos-heading" className="text-xl font-extrabold">Photos <span className="text-destructive">*</span></h2>
                    <p className="mt-1 text-[15px] text-slate-text">Up to {maxPhotos} photos. The first one is your cover: a clear front three-quarter shot works best.</p>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={addImages} tabIndex={-1} aria-hidden />
                    {photos.length > 0 && (
                      <>
                        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {photos.map((p, i) => (
                            <li key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-hairline bg-mist">
                              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                              <img src={p.preview} alt={`Photo ${i + 1}`} className={cn("size-full object-cover transition-opacity", p.status !== "done" && "opacity-80")} />
                              {p.status === "error" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night/60 p-2 text-center text-white">
                                  <AlertTriangle size={20} aria-hidden />
                                  <span className="text-[12px] font-semibold leading-tight">{p.error || "Upload failed"}</span>
                                  <button type="button" onClick={uploads.retryFailed} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-night">
                                    <RotateCcw size={12} aria-hidden /> Retry
                                  </button>
                                </div>
                              ) : p.status !== "done" ? (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/70 to-transparent px-2 pb-2 pt-6" role="status" aria-label={`Photo ${i + 1} uploading`}>
                                  <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-white">
                                    <Loader2 size={12} className="animate-spin" aria-hidden /> {p.status === "queued" ? "Waiting…" : `${Math.round(p.progress * 100)}%`}
                                  </span>
                                  <span className="block h-1 overflow-hidden rounded-full bg-white/30">
                                    <span className="block h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${Math.round(p.progress * 100)}%` }} />
                                  </span>
                                </div>
                              ) : (
                                <span className="absolute right-11 top-2 flex size-8 items-center justify-center rounded-full bg-verified text-white shadow-sm" aria-label="Uploaded">
                                  <Check size={15} aria-hidden />
                                </span>
                              )}
                              {p.status !== "error" && (i === 0 ? (
                                <span className="absolute left-2 top-2 rounded-full bg-electric px-2.5 py-1 text-[11px] font-bold text-white">Cover</span>
                              ) : (
                                <button type="button" onClick={() => uploads.makeCover(p.id)} className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-night opacity-0 shadow-sm transition-opacity focus:opacity-100 group-hover:opacity-100 max-md:opacity-100">Make cover</button>
                              ))}
                              <button type="button" onClick={() => uploads.remove(p.id)} aria-label={`Remove photo ${i + 1}`}
                                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-night/70 text-white backdrop-blur hover:bg-night">
                                <X size={15} aria-hidden />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[13px] font-semibold text-slate-text tabular" aria-live="polite">
                          {uploads.failed > 0
                            ? <span className="text-destructive">{uploads.failed} {uploads.failed === 1 ? "photo" : "photos"} didn't upload. Tap Retry.</span>
                            : uploads.done === photos.length ? <span className="text-verified">All {photos.length} photos uploaded.</span>
                              : <>Uploading in the background: {uploads.done} of {photos.length} done. You can keep filling in the form.</>}
                        </p>
                      </>
                    )}
                    {photos.length < maxPhotos && (
                      <button type="button" onClick={() => imageInputRef.current?.click()}
                        className="mt-4 flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-hairline bg-mist/60 px-6 py-10 text-center transition-colors hover:border-electric/50 hover:bg-haze/50">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-electric shadow-soft"><ImagePlus size={26} aria-hidden /></span>
                        <span className="mt-4 font-bold text-night">Add photos</span>
                        <span className="mt-1 text-sm text-slate-text">JPG, PNG or WebP · optimised automatically</span>
                        <span className="mt-2 text-[13px] font-semibold text-electric tabular">{photos.length}/{maxPhotos} added</span>
                      </button>
                    )}
                  </section>

                  <section aria-labelledby="papers-heading" className="rounded-3xl border border-hairline bg-mist p-5 md:p-6">
                    <h2 id="papers-heading" className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                      <FileCheck2 size={22} className="text-electric" aria-hidden /> Car papers
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-text">Recommended</span>
                    </h2>
                    <p className="mt-1.5 text-[15px] text-slate-text">Registration certificate, tax token, fitness certificate or ownership slip.</p>
                    <div className="mt-4 flex gap-3 rounded-2xl border border-verified/20 bg-verified-soft p-4 text-sm">
                      <ShieldCheck size={20} className="mt-0.5 shrink-0 text-verified" aria-hidden />
                      <p className="text-night">
                        <strong>Seen only by the CarHat team.</strong> Papers are never shown on your listing. Once checked, your car earns the{" "}
                        <strong className="text-verified">Paper Verified</strong> badge that buyers filter for.
                      </p>
                    </div>
                    <input ref={docInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="sr-only" onChange={addDocs} tabIndex={-1} aria-hidden />
                    {docFiles.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {docFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3">
                            <FileText size={20} className="shrink-0 text-electric" aria-hidden />
                            <span className="min-w-0 grow truncate text-sm font-semibold">{f.name}</span>
                            <button type="button" onClick={() => setDocFiles((d) => d.filter((_, idx) => idx !== i))} aria-label={`Remove ${f.name}`}
                              className="flex size-8 items-center justify-center rounded-full text-slate-text hover:bg-danger-soft hover:text-destructive">
                              <X size={16} aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {docFiles.length < 5 && (
                      <Button variant="secondary" className="mt-4" onClick={() => docInputRef.current?.click()}>
                        <Upload size={16} aria-hidden /> Add papers (PDF or photo)
                      </Button>
                    )}
                  </section>

                  <StepActions>
                    <Button variant="secondary" size="lg" onClick={() => goTo(2)} disabled={loading}><ArrowLeft size={17} aria-hidden /> Back</Button>
                    <Button size="lg" onClick={() => (photos.length ? submit() : setError("Add at least one photo of the car."))} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 size={17} className="animate-spin" aria-hidden />
                          {progress === "photos" ? `Uploading photos… ${uploads.done}/${photos.length}` : progress || "Publishing…"}
                        </>
                      ) : <>Post my car <ArrowRight size={17} aria-hidden /></>}
                    </Button>
                  </StepActions>
                </div>
              )}

              {step === 4 && result && (
                <div className="animate-in flex flex-col items-center py-8 text-center" role="status">
                  <span className={cn("flex size-20 items-center justify-center rounded-full", result.status === "active" ? "bg-verified-soft text-verified" : "bg-warning-soft text-warning")}>
                    {result.status === "active" ? <CheckCircle2 size={40} aria-hidden /> : <Clock size={40} aria-hidden />}
                  </span>
                  <h2 className="mt-6 text-3xl font-extrabold">{result.status === "active" ? "Your car is live" : "Submitted for review"}</h2>
                  <p className="mt-2 max-w-md text-slate-text">
                    <strong className="text-night">{form.year} {form.make} {form.model}</strong>{" "}
                    {result.status === "active"
                      ? "is now listed. Buyers can message you from the listing page."
                      : "will go live as soon as our team approves it, usually within a few hours."}
                  </p>
                  {docFiles.length > 0 && (
                    <p className="mt-5 flex max-w-md items-center gap-2 rounded-2xl bg-verified-soft px-4 py-3 text-left text-sm text-night">
                      <BadgeCheck size={20} className="shrink-0 text-verified" aria-hidden /> We&apos;re checking your papers. The Paper Verified badge appears once they pass.
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {result.status === "active" && result.slug && <Button asChild size="lg"><Link href={`/cars/${result.slug}`}>View listing</Link></Button>}
                    <Button asChild size="lg" variant="secondary"><Link href="/dashboard">Go to my dashboard</Link></Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-soft">
              <h2 className="text-base font-bold">Why sell on CarHat</h2>
              <ul className="mt-4 space-y-4">
                {[
                  { icon: Zap, title: "Free to post", body: "No listing fee and no commission on the sale." },
                  { icon: ShieldCheck, title: "Paper Verified badge", body: "Checked papers build trust and sell faster." },
                  { icon: Sparkles, title: "Serious buyers", body: "Chat, call or WhatsApp straight from your listing." },
                ].map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-haze text-electric"><Icon size={19} aria-hidden /></span>
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="block text-sm text-slate-text">{body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-hairline bg-mist p-6">
              <h2 className="flex items-center gap-2 text-base font-bold"><Camera size={18} className="text-electric" aria-hidden /> Photo tips</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-text">
                <li>Shoot in daylight, away from harsh shadows.</li>
                <li>Front, back, both sides, dashboard and seats.</li>
                <li>Show the odometer reading and any scratches honestly.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function StepActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center justify-between gap-3 border-t border-hairline pt-6">{children}</div>;
}
