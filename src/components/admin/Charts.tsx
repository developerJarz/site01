"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Chart palette (validated with the dataviz palette checker against #ffffff):
 * cobalt #0B4FA8 / teal #1596A8 — CVD ΔE 20.4, normal ΔE 20.9, both ≥ 3:1 contrast.
 * Fixed order: series 1 is always cobalt, series 2 always teal.
 */
export const SERIES_COLORS = ["#0b4fa8", "#1596a8"];
const GRID = "#e3e9f0";
const AXIS_TEXT = "#4a5a6e";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round the axis max up to a clean number and return 4–5 evenly spaced ticks. */
function niceTicks(max: number) {
  if (max <= 4) return [0, 1, 2, 3, 4];
  const rough = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) || rough;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

interface Series {
  name: string;
  data: { date: string; count: number }[];
}

export function LineChart({ series, height = 240 }: { series: Series[]; height?: number }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const points = series[0]?.data.length || 0;
  const pad = { top: 12, right: 16, bottom: 28, left: 36 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = height - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap((s) => s.data.map((d) => d.count)));
  const ticks = niceTicks(max);
  const yMax = ticks[ticks.length - 1];
  const x = (i: number) => (points <= 1 ? w / 2 : (i / (points - 1)) * w);
  const y = (v: number) => h - (v / yMax) * h;

  const paths = useMemo(
    () =>
      series.map((s) => s.data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join("")),
    [series, w, h, yMax]
  );

  // Show ~6 date labels whatever the range.
  const labelEvery = Math.max(1, Math.ceil(points / 6));
  const totals = series.map((s) => s.data.reduce((a, d) => a + d.count, 0));

  const onMove = (clientX: number, rect: DOMRect) => {
    if (points === 0) return;
    const rel = clientX - rect.left - pad.left;
    setHover(Math.max(0, Math.min(points - 1, Math.round((rel / Math.max(1, w)) * (points - 1)))));
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES_COLORS[i] }} aria-hidden />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-semibold tabular">{totals[i].toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => setShowTable((v) => !v)} className="text-sm font-semibold text-primary hover:underline">
          {showTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {showTable ? (
        <div className="relative max-h-[260px] overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Date</th>
                {series.map((s) => <th key={s.name} className="px-3 py-2 text-right font-semibold">{s.name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular">
              {series[0]?.data.map((d, i) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5">{shortDate(d.date)}</td>
                  {series.map((s) => <td key={s.name} className="px-3 py-1.5 text-right">{s.data[i].count}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative" style={{ height }}>
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={`${series.map((s, i) => `${s.name}: ${totals[i]}`).join(", ")}. Use arrow keys to read each day.`}
              tabIndex={0}
              className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-ring"
              onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
              onPointerLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setHover((i) => Math.min(points - 1, (i ?? -1) + 1));
                if (e.key === "ArrowLeft") setHover((i) => Math.max(0, (i ?? points) - 1));
              }}
            >
              <g transform={`translate(${pad.left},${pad.top})`}>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={0} x2={w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                    <text x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill={AXIS_TEXT} className="tabular">
                      {t.toLocaleString("en-IN")}
                    </text>
                  </g>
                ))}
                {series[0]?.data.map((d, i) =>
                  i % labelEvery === 0 || i === points - 1 ? (
                    <text key={d.date} x={x(i)} y={h + 19} textAnchor={i === 0 ? "start" : i === points - 1 ? "end" : "middle"} fontSize={12} fill={AXIS_TEXT}>
                      {shortDate(d.date)}
                    </text>
                  ) : null
                )}

                {/* Area wash under the first series only, so the two lines stay distinct. */}
                {series[0] && points > 1 && (
                  <path d={`${paths[0]}L${x(points - 1)},${h}L0,${h}Z`} fill={SERIES_COLORS[0]} opacity={0.08} />
                )}
                {paths.map((d, i) => (
                  <path key={series[i].name} d={d} fill="none" stroke={SERIES_COLORS[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                ))}

                {hover === null
                  ? series.map((s, i) =>
                      points > 0 ? (
                        <circle key={s.name} cx={x(points - 1)} cy={y(s.data[points - 1].count)} r={4} fill={SERIES_COLORS[i]} stroke="#fff" strokeWidth={2} />
                      ) : null
                    )
                  : (
                    <g>
                      <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke={AXIS_TEXT} strokeWidth={1} opacity={0.5} />
                      {series.map((s, i) => (
                        <circle key={s.name} cx={x(hover)} cy={y(s.data[hover].count)} r={4.5} fill={SERIES_COLORS[i]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </g>
                  )}
              </g>
            </svg>
          )}

          {hover !== null && series[0] && (
            <div
              className="pointer-events-none absolute top-0 z-10 min-w-[10rem] rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lift"
              style={{
                left: Math.min(Math.max(0, pad.left + x(hover) - 80), Math.max(0, width - 170)),
              }}
              role="status"
            >
              <p className="font-semibold">{shortDate(series[0].data[hover].date)}</p>
              {series.map((s, i) => (
                <p key={s.name} className="mt-1 flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES_COLORS[i] }} aria-hidden />
                  <span className="font-semibold tabular">{s.data[hover].count}</span>
                  <span className="text-muted-foreground">{s.name.toLowerCase()}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal single-series bars: label left, value at the tip.
 * Bars cap at 20px thick with a 4px rounded data end.
 */
export function BarList({
  rows,
  color = SERIES_COLORS[0],
  format = (v) => v.toLocaleString("en-IN"),
  detail,
  onSelect,
}: {
  rows: { label: string; value: number; key?: string }[];
  color?: string;
  format?: (v: number) => string;
  detail?: (row: { label: string; value: number; key?: string }) => string | undefined;
  onSelect?: (row: { label: string; value: number; key?: string }) => void;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const [active, setActive] = useState<number | null>(null);

  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;

  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => {
        const Tag = onSelect ? "button" : "div";
        return (
          <li key={r.key || r.label}>
            <Tag
              {...(onSelect ? { type: "button" as const, onClick: () => onSelect(r) } : {})}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={cn(
                "grid w-full grid-cols-[7.5rem_1fr] items-center gap-3 rounded-md text-left text-sm",
                onSelect && "hover:bg-muted/60"
              )}
            >
              <span className="truncate font-medium">{r.label}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-5 shrink-0 rounded-r"
                  style={{ width: r.value > 0 ? `max(3px, ${(r.value / max) * 82}%)` : 0, background: color, opacity: active === null || active === i ? 1 : 0.45 }}
                  aria-hidden
                />
                <span className="shrink-0 font-semibold tabular">{format(r.value)}</span>
                {active === i && detail?.(r) && (
                  <span className="truncate text-muted-foreground">{detail(r)}</span>
                )}
              </span>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}

/** Tiny trend line for a stat tile. */
export function Sparkline({ values, color = SERIES_COLORS[0] }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const W = 96, H = 28;
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * W).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`).join("");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
