"use client";

import { useId, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, XAxis, YAxis,
} from "recharts";
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

/*
 * Chart palette, validated with the dataviz palette checker against white (light-only site):
 * brand ocean #0E6AA8 / orange #D9480F / emerald #0D9668. All-pairs CVD ΔE ≥ 10, normal-vision ΔE ≥ 19, all ≥ 3:1.
 * (The logo teal is too close to the brand blue to share a chart.) Fixed order: brand, orange, emerald. No fourth hue clears the
 * all-pairs floors, so part-to-whole charts fold everything past three slices into a neutral "Other".
 */
export const SERIES_COLORS = ["#0e6aa8", "#d9480f", "#0d9668"];
export const OTHER_COLOR = "#94a3b8";

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const num = (v: number) => v.toLocaleString("en-IN");

interface Series {
  name: string;
  data: { date: string; count: number }[];
}

/** Toggle between the plot and an equivalent table, so no reading depends on the plot alone. */
function TableToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={shown} className="mt-2 text-xs font-semibold text-slate-text underline-offset-2 hover:text-electric hover:underline">
      {shown ? "Show chart" : "Show as table"}
    </button>
  );
}

/** Daily trend for 1–3 series: shadcn area chart with gradient fills, crosshair tooltip and legend. */
export function LineChart({ series, height = 260, stacked = false }: { series: Series[]; height?: number; stacked?: boolean }) {
  const gradient = useId().replace(/:/g, "");
  const [showTable, setShowTable] = useState(false);
  const config: ChartConfig = Object.fromEntries(series.map((s, i) => [`s${i}`, { label: s.name, color: SERIES_COLORS[i] }]));
  const rows = (series[0]?.data || []).map((d, i) => ({
    date: d.date,
    ...Object.fromEntries(series.map((s, j) => [`s${j}`, s.data[i]?.count ?? 0])),
  }));

  if (!rows.length) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;

  return (
    <div>
      {showTable ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-hairline">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr><th scope="col" className="px-3 py-2">Date</th>{series.map((s) => <th key={s.name} scope="col" className="px-3 py-2 text-right">{s.name}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-t border-hairline">
                  <th scope="row" className="px-3 py-1.5 font-medium">{shortDate(r.date)}</th>
                  {series.map((s, j) => <td key={s.name} className="px-3 py-1.5 text-right tabular">{num((r as Record<string, number | string>)[`s${j}`] as number)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
          <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }} accessibilityLayer>
            <defs>
              {series.map((_, i) => (
                <linearGradient key={i} id={`${gradient}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-s${i})`} stopOpacity={series.length > 1 ? 0.16 : 0.28} />
                  <stop offset="95%" stopColor={`var(--color-s${i})`} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={shortDate} />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickFormatter={(v: number) => num(v)} />
            <ChartTooltip cursor content={<ChartTooltipContent indicator="line" labelFormatter={(_, p) => longDate(String(p?.[0]?.payload?.date || ""))} />} />
            {series.map((_, i) => (
              <Area key={i} dataKey={`s${i}`} type="monotone" stackId={stacked ? "a" : undefined} stroke={`var(--color-s${i})`} strokeWidth={2}
                fill={`url(#${gradient}-${i})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
            ))}
            {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          </AreaChart>
        </ChartContainer>
      )}
      <TableToggle shown={showTable} onToggle={() => setShowTable((v) => !v)} />
    </div>
  );
}

type Row = { label: string; value: number; key?: string };

/**
 * Horizontal single-series bars (shadcn "Bar Chart - Horizontal" with value labels).
 * Category labels are focusable when the bars open something, so keyboard users can drill in too.
 */
export function BarList({
  rows,
  color = SERIES_COLORS[0],
  format = num,
  detail,
  onSelect,
}: {
  rows: Row[];
  color?: string;
  format?: (v: number) => string;
  detail?: (row: Row) => string | undefined;
  onSelect?: (row: Row) => void;
}) {
  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;
  const config: ChartConfig = { value: { label: "Count", color } };
  const data = rows.map((r) => ({ ...r, name: r.label }));

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: rows.length * 34 + 8 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }} barCategoryGap={6} accessibilityLayer>
        <XAxis type="number" dataKey="value" hide />
        <YAxis
          type="category" dataKey="label" tickLine={false} axisLine={false} width={116} interval={0}
          tick={(props: { x: number | string; y: number | string; payload: { value: string; index: number } }) => (
            <CategoryTick {...props} row={rows[props.payload.index]} onSelect={onSelect} />
          )}
        />
        <ChartTooltip cursor={false}
          content={<ChartTooltipContent hideIndicator formatter={(value, _name, item) => (
            <span className="flex w-full justify-between gap-4">
              <span className="text-slate-text">{String(item.payload?.label)}</span>
              <span className="font-bold text-night tabular">{format(Number(value))}{detail?.(item.payload as Row) ? <span className="ml-1.5 font-normal text-slate-text">{detail(item.payload as Row)}</span> : null}</span>
            </span>
          )} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} maxBarSize={20} minPointSize={3}
          className={onSelect ? "cursor-pointer" : undefined}
          onClick={onSelect ? (_: unknown, index: number) => onSelect(rows[index]) : undefined}>
          <LabelList dataKey="value" position="right" offset={8} className="fill-night font-semibold" fontSize={12} formatter={(v: unknown) => format(Number(v))} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function CategoryTick({ x, y, payload, row, onSelect }: {
  x: number | string; y: number | string; payload: { value: string }; row?: Row; onSelect?: (row: Row) => void;
}) {
  const label = payload.value.length > 16 ? payload.value.slice(0, 15) + "…" : payload.value;
  const interactive = !!onSelect && !!row;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-116} y={0} dy={4} textAnchor="start" fontSize={13} fontWeight={500}
        className={cn("fill-night", interactive && "cursor-pointer outline-none hover:fill-electric focus-visible:fill-electric focus-visible:underline")}
        {...(interactive ? {
          role: "button", tabIndex: 0, "aria-label": `${payload.value}: ${row!.value}`,
          onClick: () => onSelect!(row!),
          onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect!(row!); } },
        } : {})}
      >
        <title>{payload.value}</title>
        {label}
      </text>
    </g>
  );
}

/** Vertical single-series columns (shadcn "Bar Chart - Label"). */
export function ColumnChart({ rows, color = SERIES_COLORS[0], height = 240, format = num, onSelect }: {
  rows: Row[]; color?: string; height?: number; format?: (v: number) => string; onSelect?: (row: Row) => void;
}) {
  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;
  const config: ChartConfig = { value: { label: "Count", color } };
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={rows} margin={{ top: 22, left: 4, right: 4 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(value, _n, item) => (
          <span className="flex w-full justify-between gap-4"><span className="text-slate-text">{String(item.payload?.label)}</span><span className="font-bold tabular">{format(Number(value))}</span></span>
        )} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={44} minPointSize={2}
          className={onSelect ? "cursor-pointer" : undefined}
          onClick={onSelect ? (_: unknown, index: number) => onSelect(rows[index]) : undefined}>
          <LabelList dataKey="value" position="top" offset={8} className="fill-night font-semibold" fontSize={12} formatter={(v: unknown) => format(Number(v))} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/**
 * Two measures per category as side-by-side horizontal bars (shadcn "Bar Chart - Multiple").
 * Both measures share one axis, so they must be counts of the same kind.
 */
export function GroupedBars({ rows, series, height }: {
  rows: { label: string; [key: string]: string | number }[];
  series: { key: string; label: string }[];
  height?: number;
}) {
  if (rows.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;
  const config: ChartConfig = Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: SERIES_COLORS[i] }]));
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: height || rows.length * 54 + 48 }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 40 }} barGap={2} barCategoryGap={10} accessibilityLayer>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={124} interval={0}
          tickFormatter={(v: string) => (v.length > 17 ? v.slice(0, 16) + "…" : v)} fontSize={12} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[0, 4, 4, 0]} maxBarSize={16} minPointSize={2}>
            <LabelList dataKey={s.key} position="right" offset={6} className="fill-night" fontSize={11} formatter={(v: unknown) => num(Number(v))} />
          </Bar>
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
}

/** Part-to-whole donut (shadcn "Pie Chart - Donut with Text"), with a value legend beside it. */
export function DonutChart({ rows, centerLabel = "Total", format = num }: { rows: Row[]; centerLabel?: string; format?: (v: number) => string }) {
  const sorted = [...rows].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const shown = sorted.length > 4 ? [...sorted.slice(0, 3), { label: "Other", value: sorted.slice(3).reduce((s, r) => s + r.value, 0), key: "other" }] : sorted;
  const total = shown.reduce((s, r) => s + r.value, 0);
  const slices = shown.map((r, i) => ({ ...r, slot: `d${i}`, fill: r.label === "Other" || i > 2 ? OTHER_COLOR : SERIES_COLORS[i] }));
  const config: ChartConfig = Object.fromEntries(slices.map((s) => [s.slot, { label: s.label, color: s.fill }]));

  if (!total) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;

  return (
    // Legend sits under the ring so full category names fit even in a narrow card.
    <div className="flex flex-col items-center gap-4">
      <ChartContainer config={config} className="aspect-square w-full max-w-[180px] shrink-0">
        <PieChart accessibilityLayer>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="slot" />} />
          <Pie data={slices} dataKey="value" nameKey="slot" innerRadius="62%" outerRadius="96%" paddingAngle={slices.length > 1 ? 2 : 0} cornerRadius={4} stroke="#fff" strokeWidth={2}>
            {slices.map((s) => <Cell key={s.slot} fill={s.fill} />)}
            <Label content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-night text-xl font-extrabold">{format(total)}</tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 14} className="fill-slate-text text-[11px]">{centerLabel}</tspan>
                </text>
              );
            }} />
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.slot} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: s.fill }} aria-hidden />
            <span className="min-w-0 grow truncate text-slate-text">{s.label}</span>
            <span className="font-bold tabular">{format(s.value)}</span>
            <span className="w-10 text-right text-xs text-slate-text tabular">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One headline ratio as a radial gauge (shadcn "Radial Chart - Text"). `value` is a percentage. */
export function RadialGauge({ value, label, color = SERIES_COLORS[0] }: { value: number; label: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const config: ChartConfig = { value: { label, color } };
  return (
    <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[200px]">
      <RadialBarChart data={[{ value: pct, fill: "var(--color-value)" }]} startAngle={90} endAngle={90 - 360 * (pct / 100)} innerRadius="74%" outerRadius="100%">
        <PolarGrid gridType="circle" radialLines={false} stroke="none" className="first:fill-muted last:fill-white" polarRadius={[86, 74]} />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label content={({ viewBox }) => {
            if (!viewBox || !("cx" in viewBox)) return null;
            return (
              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-night text-2xl font-extrabold">{pct.toFixed(pct < 10 && pct > 0 ? 1 : 0)}%</tspan>
                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-slate-text text-[11px]">{label}</tspan>
              </text>
            );
          }} />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}

/** A cyclical profile such as activity by weekday (shadcn "Radar Chart - Dots"). */
export function RadarProfile({ rows, series }: { rows: { label: string; [key: string]: string | number }[]; series: { key: string; label: string }[] }) {
  const config: ChartConfig = Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: SERIES_COLORS[i] }]));
  if (!rows.some((r) => series.some((s) => Number(r[s.key]) > 0))) return <p className="py-6 text-sm text-muted-foreground">Nothing to show yet.</p>;
  return (
    <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[280px]">
      <RadarChart data={rows} outerRadius="72%">
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} />
        <PolarGrid />
        {series.map((s, i) => (
          <Radar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} fillOpacity={i === 0 ? 0.22 : 0.12} stroke={`var(--color-${s.key})`} strokeWidth={2}
            dot={{ r: 3, fillOpacity: 1 }} />
        ))}
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </RadarChart>
    </ChartContainer>
  );
}

/** Tiny trend for a stat tile. Decorative: the tile states the number. */
export function Sparkline({ values, color = SERIES_COLORS[0], width = 96, height = 32 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const gradient = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div aria-hidden style={{ width, height }} className="shrink-0">
      <AreaChart width={width} height={height} data={data} margin={{ top: 2, right: 1, bottom: 2, left: 1 }}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, "dataMax"]} />
        <Area dataKey="v" type="monotone" stroke={color} strokeWidth={1.75} fill={`url(#${gradient})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </div>
  );
}
