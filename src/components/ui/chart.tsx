"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

/*
 * shadcn/ui chart primitives (Recharts v3). Each series key in a ChartConfig becomes a
 * `--color-<key>` custom property on the container, so marks are written as `var(--color-views)`.
 */

export type ChartConfig = {
  [k in string]: { label?: React.ReactNode; icon?: React.ComponentType; color?: string };
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-slate-text [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[#eef1f5]",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#cbd5e1] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-mist",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[#e5e7eb] [&_.recharts-radial-bar-background-sector]:fill-muted",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-[#e5e7eb] [&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colors = Object.entries(config).filter(([, c]) => c.color);
  if (!colors.length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colors.map(([key, c]) => `  --color-${key}: ${c.color};`).join("\n")}\n}`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown> & { fill?: string };
};

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
  nameKey,
  labelKey,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: React.ReactNode;
  className?: string;
  indicator?: "line" | "dot" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode;
  formatter?: (value: number | string, name: string, item: TooltipPayloadItem) => React.ReactNode;
  nameKey?: string;
  labelKey?: string;
}) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = configFor(config, item, key);
    const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;
    if (labelFormatter) return <div className="font-semibold text-night">{labelFormatter(value ?? label, payload)}</div>;
    return value ? <div className="font-semibold text-night">{value}</div> : null;
  }, [label, labelFormatter, payload, hideLabel, config, labelKey]);

  if (!active || !payload?.length) return null;
  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div className={cn("grid min-w-[9rem] items-start gap-1.5 rounded-xl border border-hairline bg-white/95 px-3 py-2 text-xs shadow-float backdrop-blur", className)}>
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = configFor(config, item, key);
          const indicatorColor = item.payload?.fill || item.color || item.fill;
          return (
            <div key={`${item.dataKey}-${index}`} className={cn("flex w-full flex-wrap items-stretch gap-2", indicator === "dot" && "items-center")}>
              {formatter && item.value !== undefined && item.name !== undefined ? (
                formatter(item.value, String(item.name), item)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                        "size-2.5": indicator === "dot",
                        "w-1": indicator === "line",
                        "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                        "my-0.5": nestLabel && indicator === "dashed",
                      })}
                      style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor } as React.CSSProperties}
                    />
                  )}
                  <div className={cn("flex flex-1 justify-between gap-4 leading-none", nestLabel ? "items-end" : "items-center")}>
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-slate-text">{itemConfig?.label || item.name}</span>
                    </div>
                    {item.value !== undefined && (
                      <span className="font-bold text-night tabular">{typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: {
  className?: string;
  hideIcon?: boolean;
  payload?: { value?: string; dataKey?: string | number; color?: string; payload?: Record<string, unknown> }[];
  verticalAlign?: "top" | "bottom" | "middle";
  nameKey?: string;
}) {
  const { config } = useChart();
  if (!payload?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = configFor(config, item as TooltipPayloadItem, key);
        return (
          <div key={String(item.value)} className="flex items-center gap-1.5 text-[13px] text-slate-text [&>svg]:size-3 [&>svg]:text-slate-text">
            {itemConfig?.icon && !hideIcon ? <itemConfig.icon /> : <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />}
            {itemConfig?.label || item.value}
          </div>
        );
      })}
    </div>
  );
}

function configFor(config: ChartConfig, payload: TooltipPayloadItem | undefined, key: string) {
  if (!payload || typeof payload !== "object") return undefined;
  const inner = payload.payload && typeof payload.payload === "object" ? payload.payload : undefined;
  let labelKey = key;
  if (typeof (payload as Record<string, unknown>)[key] === "string") labelKey = (payload as Record<string, unknown>)[key] as string;
  else if (inner && typeof inner[key] === "string") labelKey = inner[key] as string;
  return labelKey in config ? config[labelKey] : config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
