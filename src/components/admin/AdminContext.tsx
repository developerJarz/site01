"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Permission } from "@/lib/permissions";

export interface DashboardPrefs { order?: string[]; hidden?: string[] }
export interface AdminMe {
  role: string;
  roleName: string;
  permissions: Permission[];
  prefs: { dashboard?: DashboardPrefs };
}

interface AdminContextValue {
  me: AdminMe | null;
  /** True while the first load is in flight; pages wait instead of flashing "no access". */
  loading: boolean;
  can: (...anyOf: Permission[]) => boolean;
  saveDashboardPrefs: (prefs: DashboardPrefs) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue>({
  me: null,
  loading: true,
  can: () => false,
  saveDashboardPrefs: async () => {},
});

/** Who is signed in to the admin area and what their role allows. The API enforces the same rules. */
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.permissions) setMe(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const can = useCallback((...anyOf: Permission[]) => !!me && anyOf.some((p) => me.permissions.includes(p)), [me]);

  const saveDashboardPrefs = useCallback(async (dashboard: DashboardPrefs) => {
    setMe((m) => (m ? { ...m, prefs: { ...m.prefs, dashboard } } : m));
    const res = await fetch("/api/admin/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dashboard }) });
    if (!res.ok) throw new Error("Couldn't save your layout.");
  }, []);

  return <AdminContext.Provider value={{ me, loading, can, saveDashboardPrefs }}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
