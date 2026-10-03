"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Tone = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  success: (message: string, action?: ToastItem["action"]) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message: string, tone: Tone, action?: ToastItem["action"]) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-2), { id, message, tone, action }]);
      setTimeout(() => dismiss(id), action ? 7000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (m, a) => push(m, "success", a), error: (m) => push(m, "error") }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-[24rem]" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="animate-in pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-ink-deep px-4 py-3 text-[15px] text-white shadow-pop"
          >
            {t.tone === "success" ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#6ee7b0]" aria-hidden />
            ) : (
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-[#ff9b9b]" aria-hidden />
            )}
            <p className="grow">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 font-semibold text-teal-soft hover:underline"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="-mr-1 shrink-0 rounded p-0.5 text-white/60 hover:text-white" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
