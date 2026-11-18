"use client";

import { Check } from "lucide-react";
import { FUELS } from "@/components/home/data";
import { cn } from "@/lib/utils";

/** Pick every fuel a car runs on (e.g. Octane + CNG). The first picked is the primary fuel; one is always kept. */
export function FuelPicker({ value, onChange, legend = "Fuel", hint = "Choose all that apply, e.g. Octane and CNG." }: {
  value: string[]; onChange: (value: string[]) => void; legend?: string; hint?: string;
}) {
  const toggle = (fuel: string) => {
    if (value.includes(fuel)) {
      if (value.length > 1) onChange(value.filter((f) => f !== fuel));
    } else onChange([...value, fuel]);
  };
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {FUELS.map((f) => {
          const on = value.includes(f.value);
          return (
            <button key={f.value} type="button" aria-pressed={on} onClick={() => toggle(f.value)}
              className={cn("inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                on ? "border-electric bg-haze text-electric-deep" : "border-hairline text-slate-text hover:border-electric/40 hover:text-night")}>
              {on && <Check size={14} aria-hidden />} {f.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-text">{hint}</p>}
    </fieldset>
  );
}
