"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Database, HardDrive, RefreshCw, Settings, ShieldAlert, XCircle } from "lucide-react";
import { Button, PageHeader, Panel, api } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

interface SystemData {
  checkedAt: string;
  runtime: { node: string; env: string };
  db: { ok: boolean; latencyMs?: number; error?: string };
  storage: { uploadsWritable: boolean; imageOptimiser: boolean; cloudinaryConfigured: boolean };
  config: { key: string; ok: boolean; note: string }[];
  counts: Record<string, number>;
  settings: { autoApproveListings?: boolean; defaultListingStatus?: string; maxImagesPerListing?: number; maintenanceMode?: boolean; updatedAt?: string } | null;
}

const COUNT_LABEL: Record<string, string> = {
  users: "Accounts", listings: "Listings", conversations: "Chats", messages: "Chat messages", favorites: "Saved cars",
  blogPosts: "Blog posts", subscribers: "Newsletter", contactMessages: "Inbox messages",
};

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<SystemData>("/api/admin/system"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const issues = data ? data.config.filter((c) => !c.ok).length + (data.db.ok ? 0 : 1) + (data.storage.uploadsWritable ? 0 : 1) : 0;
  const approval = data?.settings
    ? data.settings.autoApproveListings || data.settings.defaultListingStatus === "active" ? "Go live straight away" : "Wait for admin review"
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="System health" description={data ? `Checked ${new Date(data.checkedAt).toLocaleTimeString()} · Node ${data.runtime.node} · ${data.runtime.env}` : "Checking…"}
        actions={<Button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden /> Re-check</Button>} />

      {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

      {data && (
        <div className={cn("flex items-center gap-4 rounded-3xl border p-5", issues ? "border-warning/25 bg-warning-soft/50" : "border-verified/25 bg-verified-soft/60")}>
          {issues ? <ShieldAlert size={28} className="shrink-0 text-warning" aria-hidden /> : <CheckCircle2 size={28} className="shrink-0 text-verified" aria-hidden />}
          <div>
            <p className="font-extrabold">{issues ? `${issues} ${issues === 1 ? "thing needs" : "things need"} attention` : "Everything looks healthy"}</p>
            <p className="text-sm text-slate-text">Values are never shown here, only whether each one is set.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Database">
          {data ? (
            <div className="flex items-center gap-4">
              <span className={cn("flex size-12 items-center justify-center rounded-2xl", data.db.ok ? "bg-verified-soft text-verified" : "bg-danger-soft text-destructive")}><Database size={22} aria-hidden /></span>
              <div>
                <p className="font-extrabold">{data.db.ok ? "Connected" : "Not reachable"}</p>
                <p className="text-sm text-slate-text tabular">{data.db.ok ? `${data.db.latencyMs} ms round trip` : data.db.error}</p>
              </div>
            </div>
          ) : <div className="skeleton h-12 rounded-2xl" />}
        </Panel>
        <Panel title="File storage">
          {data ? (
            <ul className="space-y-2 text-sm">
              <Check ok={data.storage.cloudinaryConfigured} label="Cloudinary photo storage configured" hint={data.storage.cloudinaryConfigured ? "Profile and listing photos are compressed before upload." : "Set CLOUDINARY_URL on the server to enable photo uploads."} />
              <Check ok={data.storage.uploadsWritable} label="Document storage on disk" hint={data.storage.uploadsWritable ? undefined : "Verification papers fall back to database storage."} />
              <Check ok={data.storage.imageOptimiser} label="Image optimiser (sharp)" hint={data.storage.imageOptimiser ? undefined : "Photo uploads need sharp to process images."} />
            </ul>
          ) : <div className="skeleton h-12 rounded-2xl" />}
        </Panel>
        <Panel title="Listing rules" action={<Link href="/admin/settings" className="text-sm font-semibold text-electric hover:underline">Change</Link>}>
          {data ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-text">New listings</dt><dd className="font-bold">{approval}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-text">Photos per listing</dt><dd className="font-bold tabular">{data.settings?.maxImagesPerListing ?? 10}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-text">Maintenance mode</dt><dd className={cn("font-bold", data.settings?.maintenanceMode ? "text-warning" : "text-verified")}>{data.settings?.maintenanceMode ? "On" : "Off"}</dd></div>
            </dl>
          ) : <div className="skeleton h-16 rounded-2xl" />}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Configuration" subtitle="Environment variables on the server">
          {data ? <ul className="space-y-3 text-sm">{data.config.map((c) => <Check key={c.key} ok={c.ok} label={c.key} hint={c.note} />)}</ul> : <div className="skeleton h-40 rounded-2xl" />}
        </Panel>
        <Panel title="Records" subtitle="Approximate counts">
          {data ? (
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(data.counts).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-mist p-4">
                  <dt className="text-[13px] text-slate-text">{COUNT_LABEL[k] || k}</dt>
                  <dd className="mt-1 text-xl font-extrabold tabular">{v.toLocaleString("en-IN")}</dd>
                </div>
              ))}
            </dl>
          ) : <div className="skeleton h-40 rounded-2xl" />}
        </Panel>
      </div>

      <p className="flex items-center gap-2 text-sm text-slate-text">
        <HardDrive size={15} aria-hidden /> A public uptime check is available at <code className="rounded bg-mist px-1.5 py-0.5 text-night">/api/health</code>.
        <Link href="/admin/settings" className="ml-auto inline-flex items-center gap-1 font-semibold text-electric hover:underline"><Settings size={14} aria-hidden /> Site settings</Link>
      </p>
    </div>
  );
}

function Check({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex gap-3">
      {ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-verified" aria-label="OK" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" aria-label="Needs attention" />}
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-[13px] text-slate-text">{hint}</span>}
      </span>
    </li>
  );
}
