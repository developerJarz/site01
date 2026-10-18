"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Field, Panel, SwitchRow, inputClass } from "./ui";
import { DEFAULT_WATERMARK, HEX_COLOR, WATERMARK_FONTS, type WatermarkSettings } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type W = WatermarkSettings;

/** One-click starting points; every value can still be fine-tuned afterwards. */
const PRESETS: { label: string; hint: string; values: Partial<W> }[] = [
  { label: "Glass outline", hint: "See-through letters, thin white edge", values: { style: "outline", font: "geist", strokeColor: "#f6f8fa", strokeWidth: 4, opacity: 0.65, shadow: 20, uppercase: true, letterSpacing: 8, position: "center", rotation: 0, scale: 100 } },
  { label: "Soft white", hint: "Solid white, very see-through", values: { style: "solid", font: "poppins", textColor: "#ffffff", opacity: 0.4, shadow: 30, uppercase: true, letterSpacing: 6, position: "center", rotation: 0, scale: 100 } },
  { label: "Bold stamp", hint: "Heavy letters with a dark edge", values: { style: "solid-outline", font: "archivo-black", textColor: "#ffffff", strokeColor: "#0b1d36", strokeWidth: 3, opacity: 0.55, shadow: 10, uppercase: true, letterSpacing: 4, position: "center", rotation: 0, scale: 100 } },
  { label: "Diagonal", hint: "Tilted across the car", values: { style: "outline", font: "anton", strokeColor: "#ffffff", strokeWidth: 3, opacity: 0.55, shadow: 15, uppercase: true, letterSpacing: 10, position: "center", rotation: -25, scale: 120 } },
  { label: "Corner tag", hint: "Small, bottom right", values: { style: "solid", font: "poppins-bold", textColor: "#ffffff", opacity: 0.8, shadow: 45, uppercase: false, letterSpacing: 2, position: "bottom-right", rotation: 0, scale: 100, size: "small" } },
];

const SWATCHES = ["#ffffff", "#f6f8fa", "#e2e8f0", "#94a3b8", "#0b1d36", "#000000", "#0e6aa8", "#22b4c4", "#facc15", "#ef4444"];

const POSITIONS: { value: W["position"]; label: string; cell: string }[] = [
  { value: "top-left", label: "Top left", cell: "col-start-1 row-start-1" },
  { value: "top-right", label: "Top right", cell: "col-start-3 row-start-1" },
  { value: "center", label: "Centre", cell: "col-start-2 row-start-2" },
  { value: "bottom-left", label: "Bottom left", cell: "col-start-1 row-start-3" },
  { value: "bottom-right", label: "Bottom right", cell: "col-start-3 row-start-3" },
];

const SAMPLES = [
  { value: "light", label: "White car" },
  { value: "dark", label: "Black car" },
  { value: "suv", label: "Silver SUV" },
];

/**
 * Full control over the copyright mark on listing photos, with a live preview drawn on the server
 * by the same code that marks real uploads, so what you see is exactly what buyers get.
 */
export function WatermarkEditor({ value, siteName, onChange }: { value: W; siteName: string; onChange: (v: W) => void }) {
  const set = (patch: Partial<W>) => onChange({ ...value, ...patch });
  const outlined = value.style !== "solid";
  const filled = value.style !== "outline";

  return (
    <Panel title="Photo watermark" subtitle="The mark stamped on every new listing photo, so copies can be traced back to you"
      action={<ShieldCheck size={18} className="text-slate-text" aria-hidden />}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <SwitchRow title="Watermark new listing photos" description="Applies to photos uploaded from now on. Logos and website images are never marked."
            checked={value.enabled} onChange={(v) => set({ enabled: v })} />

          <fieldset disabled={!value.enabled} className="space-y-6 disabled:opacity-50">
            <Group title="Quick styles">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESETS.map((p) => (
                  <button key={p.label} type="button" onClick={() => set(p.values)}
                    className="rounded-xl border border-hairline bg-white px-3 py-2.5 text-left transition-colors hover:border-electric/40 hover:bg-haze/40">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-night"><Sparkles size={13} className="text-electric" aria-hidden /> {p.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-text">{p.hint}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Text">
              <Field label="Top line" htmlFor="wm-text" hint={`Empty uses your site name (${siteName}).`}>
                <input id="wm-text" value={value.text} maxLength={40} onChange={(e) => set({ text: e.target.value })} placeholder={siteName} className={inputClass} />
              </Field>
              <SwitchRow title="Uploader's name as the second line" description="Dealers show their dealership name." checked={value.showUploader} onChange={(v) => set({ showUploader: v })} disabled={!value.enabled} />
              {value.showUploader && (
                <Field label="Words before the name (optional)" htmlFor="wm-prefix" hint="e.g. “Uploaded by” or “Posted by”. Empty shows just the name.">
                  <input id="wm-prefix" value={value.uploaderPrefix} maxLength={24} onChange={(e) => set({ uploaderPrefix: e.target.value })} placeholder="Uploaded by" className={inputClass} />
                </Field>
              )}
              <SwitchRow title="ALL CAPITALS" description="Uppercase letters read best as a watermark." checked={value.uppercase} onChange={(v) => set({ uppercase: v })} disabled={!value.enabled} />
            </Group>

            <Group title="Font and style">
              <Field label="Font" htmlFor="wm-font">
                <select id="wm-font" value={value.font} onChange={(e) => set({ font: e.target.value as W["font"] })} className={inputClass}>
                  {WATERMARK_FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </Field>
              <div>
                <p className="field-label">Letter style</p>
                <Segmented value={value.style} onChange={(v) => set({ style: v })} label="Letter style"
                  options={[{ value: "outline", label: "Outline" }, { value: "solid", label: "Solid" }, { value: "solid-outline", label: "Solid + outline" }]} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {filled && <ColorField id="wm-fill" label="Letter colour" value={value.textColor} onChange={(c) => set({ textColor: c })} />}
                {outlined && <ColorField id="wm-stroke" label="Outline colour" value={value.strokeColor} onChange={(c) => set({ strokeColor: c })} />}
              </div>
              {outlined && <Slider id="wm-stroke-width" label="Outline thickness" value={value.strokeWidth} min={1} max={10} onChange={(n) => set({ strokeWidth: n })} format={(n) => `${n} / 10`} />}
            </Group>

            <Group title="Transparency and shadow">
              <Slider id="wm-transparency" label="Transparency" value={Math.round((1 - value.opacity) * 100)} min={0} max={95} step={5}
                onChange={(n) => set({ opacity: Math.round((1 - n / 100) * 100) / 100 })} format={(n) => (n === 0 ? "Solid" : `${n}% see-through`)} />
              <Slider id="wm-shadow" label="Shadow" value={value.shadow} min={0} max={100} step={5} onChange={(n) => set({ shadow: n })} format={(n) => (n === 0 ? "Off" : `${n}%`)}
                hint="A soft dark shadow keeps light marks visible on white cars." />
            </Group>

            <Group title="Size and spacing">
              <div>
                <p className="field-label">Size</p>
                <Segmented value={value.size} onChange={(v) => set({ size: v })} label="Size"
                  options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} />
              </div>
              <Slider id="wm-scale" label="Fine-tune size" value={value.scale} min={50} max={250} step={5} onChange={(n) => set({ scale: n })} format={(n) => `${n}%`} />
              {value.showUploader && (
                <Slider id="wm-site-line" label="Top line size (compared with the name)" value={value.siteLineSize} min={40} max={100} step={5} onChange={(n) => set({ siteLineSize: n })} format={(n) => `${n}%`} />
              )}
              <Slider id="wm-spacing" label="Letter spacing" value={value.letterSpacing} min={0} max={30} onChange={(n) => set({ letterSpacing: n })} format={(n) => `${n}%`} />
            </Group>

            <Group title="Position and angle">
              <div className="grid max-w-sm grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl border border-dashed border-hairline p-1.5" role="radiogroup" aria-label="Watermark position">
                {POSITIONS.map((p) => (
                  <button key={p.value} type="button" role="radio" aria-checked={value.position === p.value} onClick={() => set({ position: p.value })}
                    className={cn("h-9 rounded-xl border text-[13px] font-semibold transition-colors", p.cell,
                      value.position === p.value ? "border-electric bg-haze text-electric-deep" : "border-hairline bg-white text-slate-text hover:text-night")}>
                    {p.label}
                  </button>
                ))}
              </div>
              <Slider id="wm-rotation" label="Angle" value={value.rotation} min={-45} max={45} onChange={(n) => set({ rotation: n })} format={(n) => (n === 0 ? "Straight" : `${n}°`)} />
              <div className="flex flex-wrap gap-1.5">
                {[-30, -15, 0, 15, 30].map((deg) => (
                  <button key={deg} type="button" onClick={() => set({ rotation: deg })} aria-pressed={value.rotation === deg}
                    className={cn("h-8 rounded-lg border px-2.5 text-xs font-semibold", value.rotation === deg ? "border-electric bg-haze text-electric-deep" : "border-hairline bg-white text-slate-text hover:text-night")}>
                    {deg === 0 ? "Straight" : `${deg}°`}
                  </button>
                ))}
              </div>
            </Group>
          </fieldset>

          <Button variant="ghost" onClick={() => onChange({ ...DEFAULT_WATERMARK, enabled: value.enabled })}><RotateCcw size={15} aria-hidden /> Reset to the default look</Button>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <LivePreview value={value} />
        </div>
      </div>
    </Panel>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-hairline pt-5 first:border-0 first:pt-0">
      <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-text">{title}</h3>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit max-w-full flex-wrap gap-1 rounded-2xl bg-mist p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("h-9 rounded-xl px-3.5 text-[13px] font-semibold transition-colors", value === o.value ? "bg-white text-night shadow-soft" : "text-slate-text hover:text-night")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ id, label, value, min, max, step = 1, onChange, format, hint }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; format: (n: number) => string; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="field-label">{label}</label>
        <span className="mb-1.5 text-xs font-bold text-electric-deep tabular">{format(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-electric" />
      {hint && <p className="mt-1 text-xs text-slate-text">{hint}</p>}
    </div>
  );
}

/** Colour picker, hex box and a row of common colours. */
function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (c: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} picker`} value={HEX_COLOR.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-hairline bg-white p-1" />
        <input id={id} value={text} maxLength={7} onChange={(e) => { setText(e.target.value); if (HEX_COLOR.test(e.target.value.trim())) onChange(e.target.value.trim().toLowerCase()); }}
          className={cn(inputClass, "w-28 font-mono")} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`${label} suggestions`}>
        {SWATCHES.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Use ${c}`} aria-pressed={value === c}
            className={cn("size-6 rounded-full border border-hairline ring-offset-2", value === c && "ring-2 ring-electric")} style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

/** The real mark on a sample photo, re-drawn a moment after each change. */
function LivePreview({ value }: { value: W }) {
  const [sample, setSample] = useState("light");
  const [uploader, setUploader] = useState("Rahim Ahmed");
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/watermark/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watermark: value, sample, uploader }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't draw the preview.");
        const url = URL.createObjectURL(await res.blob());
        if (ticket !== latest.current) { URL.revokeObjectURL(url); return; }
        setSrc((old) => { if (old) URL.revokeObjectURL(old); return url; });
        setError("");
      } catch (e) {
        if (ticket === latest.current) setError((e as Error).message);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [value, sample, uploader]);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="field-label mb-0 flex items-center gap-1.5"><ImageIcon size={14} aria-hidden /> Live preview</p>
        <Segmented value={sample} onChange={setSample} label="Sample photo" options={SAMPLES} />
      </div>
      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-mist">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- generated preview image
          <img src={src} alt="Sample car photo with your watermark" className={cn("size-full object-cover transition-opacity", loading && "opacity-70")} />
        )}
        {loading && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-night/70 px-2.5 py-1 text-xs font-semibold text-white">
            <Loader2 size={13} className="animate-spin" aria-hidden /> Updating
          </span>
        )}
        {error && !loading && <p role="alert" className="absolute inset-x-3 bottom-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
      </div>
      <Field label="Name to preview" htmlFor="wm-preview-name">
        <input id="wm-preview-name" value={uploader} maxLength={40} onChange={(e) => setUploader(e.target.value)} className={inputClass} />
      </Field>
      <p className="text-[13px] text-slate-text">Drawn by the same code that marks real uploads, on a photo the size listings are stored at (1600 px).</p>
    </div>
  );
}
