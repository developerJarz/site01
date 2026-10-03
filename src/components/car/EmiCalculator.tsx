"use client";

import { useId, useState } from "react";
import { formatLakh, formatTaka } from "@/lib/utils";

const TENURES = [1, 2, 3, 4, 5];

/** Standard reducing-balance EMI. Rate is annual %, tenure in years. */
function emi(principal: number, ratePct: number, years: number) {
  const n = years * 12;
  const r = ratePct / 12 / 100;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(30);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(12);
  const id = useId();

  const down = Math.round((price * downPct) / 100);
  const loan = price - down;
  const monthly = Math.round(emi(loan, rate, years));
  const totalInterest = Math.max(0, monthly * years * 12 - loan);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-bold">Car loan estimate</h2>
      <p className="mt-3 text-sm text-muted-foreground">Monthly payment</p>
      <p className="price-tag text-3xl" aria-live="polite">
        {formatTaka(monthly)}
        <span className="ml-1 text-base font-semibold text-muted-foreground" style={{ fontStretch: "100%" }}>/month</span>
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <label htmlFor={`${id}-down`} className="font-semibold">Down payment</label>
            <span className="text-muted-foreground tabular">{downPct}% ({formatLakh(down)})</span>
          </div>
          <input
            id={`${id}-down`}
            type="range"
            min={10}
            max={90}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">Loan term</legend>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {TENURES.map((y) => (
              <button
                key={y}
                type="button"
                aria-pressed={years === y}
                onClick={() => setYears(y)}
                className={
                  years === y
                    ? "rounded-md bg-primary py-1.5 text-sm font-semibold text-white"
                    : "rounded-md border border-border py-1.5 text-sm font-medium hover:border-primary"
                }
              >
                {y} yr
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between text-sm">
            <label htmlFor={`${id}-rate`} className="font-semibold">Interest rate</label>
            <span className="text-muted-foreground tabular">{rate}% a year</span>
          </div>
          <input
            id={`${id}-rate`}
            type="range"
            min={7}
            max={18}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Loan amount</dt>
          <dd className="font-semibold tabular">{formatLakh(loan)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total interest</dt>
          <dd className="font-semibold tabular">{formatLakh(totalInterest)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        An estimate only. Your bank sets the actual rate, and some limit car loans to a share of the price.
      </p>
    </div>
  );
}
