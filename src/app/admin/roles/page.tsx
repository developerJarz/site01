"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Lock, Minus, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, Users } from "lucide-react";
import { Button, Field, Modal, PageHeader, Panel, api, inputClass, useConfirm } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import { BUILT_IN_STAFF_ROLES, MARKETPLACE_ROLE_LABEL, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type PermissionInfo = { key: Permission; label: string; group: string };
type Role = { key: string; name: string; description: string; permissions: Permission[]; builtIn?: boolean; members: number };
type RolesResponse = { roles: Role[]; marketplace: { key: string; members: number }[]; permissions: PermissionInfo[]; myRole: string };
type Draft = { key?: string; name: string; description: string; permissions: Permission[] };

const ROLE_TINT = ["bg-haze text-electric-deep", "bg-verified-soft text-verified", "bg-warning-soft text-warning", "bg-[#f3e8ff] text-[#6b21a8]", "bg-[#fce7f3] text-[#9d174d]"];

export default function RolesPage() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [data, setData] = useState<RolesResponse | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Role | null>(null);
  const [reassignTo, setReassignTo] = useState("buyer");

  const load = useCallback(async () => {
    try { setData(await api<RolesResponse>("/api/admin/roles")); setError(""); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const p of data?.permissions || []) map.set(p.group, [...(map.get(p.group) || []), p]);
    return [...map.entries()];
  }, [data]);

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft.key) await api("/api/admin/roles", { method: "PATCH", body: JSON.stringify(draft) });
      else await api("/api/admin/roles", { method: "POST", body: JSON.stringify(draft) });
      toast.success(draft.key ? `${draft.name} updated. Members get the new access within a minute.` : `${draft.name} created. Give it to people from Users.`);
      setDraft(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async (role: Role) => {
    const ok = await confirm({ title: `Reset ${role.name}?`, body: "Its name and permissions go back to the original settings.", confirmLabel: "Reset role" });
    if (!ok) return;
    try { await api("/api/admin/roles", { method: "DELETE", body: JSON.stringify({ key: role.key }) }); toast.success(`${role.name} reset.`); await load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  const remove = async () => {
    if (!removing) return;
    setSaving(true);
    try {
      await api("/api/admin/roles", { method: "DELETE", body: JSON.stringify({ key: removing.key, reassignTo }) });
      toast.success(`${removing.name} deleted.`);
      setRemoving(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (p: Permission) =>
    setDraft((d) => (d ? { ...d, permissions: d.permissions.includes(p) ? d.permissions.filter((x) => x !== p) : [...d.permissions, p] } : d));
  const toggleGroup = (list: PermissionInfo[], on: boolean) =>
    setDraft((d) => (d ? { ...d, permissions: on ? [...new Set([...d.permissions, ...list.map((p) => p.key)])] : d.permissions.filter((p) => !list.some((x) => x.key === p)) } : d));

  const roles = data?.roles || [];
  const changed = (r: Role) => {
    const original = BUILT_IN_STAFF_ROLES.find((b) => b.key === r.key);
    return !!original && r.key !== "admin" && (original.name !== r.name || original.permissions.join() !== r.permissions.join());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & access"
        description="Decide what each person on your team can see and do. Give someone a role from Users."
        actions={<Button variant="primary" onClick={() => setDraft({ name: "", description: "", permissions: ["dashboard.view"] })}><Plus size={16} aria-hidden /> New role</Button>}
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}

      {!data ? (
        !error && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-3xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roles.map((r, i) => (
              <article key={r.key} className="flex flex-col rounded-3xl border border-hairline bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("flex size-11 items-center justify-center rounded-2xl", ROLE_TINT[i % ROLE_TINT.length])}>
                    {r.key === "admin" ? <ShieldCheck size={20} aria-hidden /> : <Users size={20} aria-hidden />}
                  </span>
                  <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-bold text-slate-text">{r.builtIn ? "Built-in" : "Custom"}</span>
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-night">{r.name}</h2>
                <p className="mt-1 line-clamp-2 grow text-[13px] text-slate-text">{r.description || "No description."}</p>
                <div className="mt-4 flex items-center justify-between text-[13px]">
                  <Link href={`/admin/users?role=${r.key}`} className="font-semibold text-electric hover:underline">{r.members} {r.members === 1 ? "person" : "people"}</Link>
                  <span className="text-slate-text tabular">{r.permissions.length} / {data.permissions.length} permissions</span>
                </div>
                <div className="mt-4 flex gap-1.5 border-t border-hairline pt-4">
                  {r.key === "admin" ? (
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-text"><Lock size={14} aria-hidden /> Always full access</p>
                  ) : (
                    <>
                      <Button size="sm" disabled={r.key === data.myRole} onClick={() => setDraft({ key: r.key, name: r.name, description: r.description, permissions: [...r.permissions] })}>
                        <Pencil size={14} aria-hidden /> Edit
                      </Button>
                      {r.builtIn ? (
                        changed(r) && <Button size="sm" variant="ghost" disabled={r.key === data.myRole} onClick={() => reset(r)}><RotateCcw size={14} aria-hidden /> Reset</Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={r.key === data.myRole} onClick={() => { setRemoving(r); setReassignTo("buyer"); }} aria-label={`Delete ${r.name}`}><Trash2 size={14} aria-hidden /></Button>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <Panel title="Who can do what" subtitle="Every permission for every team role" flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="border-y border-hairline bg-mist/70 text-left text-[13px] text-slate-text">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold md:px-6">Permission</th>
                    {roles.map((r) => <th key={r.key} scope="col" className="px-3 py-3 text-center font-semibold">{r.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {groups.map(([group, perms]) => (
                    <FragmentRows key={group} group={group} perms={perms} roles={roles} />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Customer accounts" subtitle="These roles use the marketplace and can't open the admin area">
            <ul className="flex flex-wrap gap-2">
              {data.marketplace.map((m) => (
                <li key={m.key}>
                  <Link href={`/admin/users?role=${m.key}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-white px-3.5 text-sm font-semibold hover:bg-mist">
                    {MARKETPLACE_ROLE_LABEL[m.key] || m.key} <span className="rounded-full bg-mist px-2 text-xs tabular text-slate-text">{m.members.toLocaleString("en-IN")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} size="lg" title={draft?.key ? `Edit ${draft.name}` : "New role"}
        description="Tick what people with this role may do. They see only the admin pages their permissions allow."
        footer={<><Button onClick={() => setDraft(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={saveDraft}>{draft?.key ? "Save role" : "Create role"}</Button></>}>
        {draft && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Role name" htmlFor="r-name"><input id="r-name" value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Listing checker" className={inputClass} data-autofocus /></Field>
              <Field label="Description" htmlFor="r-desc"><input id="r-desc" value={draft.description} maxLength={200} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What this person does" className={inputClass} /></Field>
            </div>
            {!draft.key && roles.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="font-semibold text-slate-text">Start from:</span>
                {roles.filter((r) => r.key !== "admin").map((r) => (
                  <button key={r.key} type="button" onClick={() => setDraft({ ...draft, permissions: [...r.permissions] })} className="rounded-full border border-hairline px-3 py-1 font-semibold hover:bg-mist">{r.name}</button>
                ))}
              </div>
            )}
            <div className="space-y-4">
              {groups.map(([group, perms]) => {
                const all = perms.every((p) => draft.permissions.includes(p.key));
                const some = perms.some((p) => draft.permissions.includes(p.key));
                return (
                  <fieldset key={group} className="rounded-2xl border border-hairline p-4">
                    <div className="flex items-center justify-between gap-2">
                      <legend className="text-sm font-extrabold text-night">{group}</legend>
                      <button type="button" onClick={() => toggleGroup(perms, !all)} className="text-[13px] font-semibold text-electric hover:underline">{all ? "Clear" : some ? "Select all" : "Select all"}</button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {perms.map((p) => (
                        <label key={p.key} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                          draft.permissions.includes(p.key) ? "border-electric/30 bg-haze/60" : "border-hairline hover:bg-mist")}>
                          <input type="checkbox" checked={draft.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} className="mt-0.5 size-[18px] accent-electric" />
                          <span className="font-medium text-night">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
            {draft.permissions.includes("roles.manage") && (
              <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-[#7c2d12]">“Create roles and give people staff access” lets this role give others team access. Only give it to people you trust.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!removing} onClose={() => setRemoving(null)} size="sm" title={`Delete ${removing?.name || "role"}?`}
        footer={<><Button onClick={() => setRemoving(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={remove}>Delete role</Button></>}>
        {removing && (
          removing.members > 0 ? (
            <Field label={`Move the ${removing.members} ${removing.members === 1 ? "person" : "people"} with this role to`} htmlFor="r-move">
              <select id="r-move" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className={inputClass}>
                <optgroup label="Customer roles">{Object.entries(MARKETPLACE_ROLE_LABEL).filter(([k]) => k !== "guest").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</optgroup>
                <optgroup label="Team roles">{roles.filter((r) => r.key !== removing.key && (r.key !== "admin" || data?.myRole === "admin")).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</optgroup>
              </select>
            </Field>
          ) : <p className="text-[15px] text-slate-text">Nobody has this role. This can&apos;t be undone.</p>
        )}
      </Modal>
      {dialog}
    </div>
  );
}

function FragmentRows({ group, perms, roles }: { group: string; perms: PermissionInfo[]; roles: Role[] }) {
  return (
    <>
      <tr className="bg-mist/40"><th colSpan={roles.length + 1} scope="colgroup" className="px-5 pb-1.5 pt-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-text md:px-6">{group}</th></tr>
      {perms.map((p) => (
        <tr key={p.key} className="border-b border-hairline last:border-0">
          <th scope="row" className="px-5 py-2.5 text-left font-medium text-night md:px-6">{p.label}</th>
          {roles.map((r) => (
            <td key={r.key} className="px-3 py-2.5 text-center">
              {r.permissions.includes(p.key)
                ? <Check size={17} className="mx-auto text-verified" aria-label="Allowed" />
                : <Minus size={15} className="mx-auto text-[#cbd5e1]" aria-label="Not allowed" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
