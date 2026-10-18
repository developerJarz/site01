import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageSquare, ShieldCheck } from "lucide-react";

const POINTS = [
  { icon: ShieldCheck, text: "Paper Verified cars, checked by our team" },
  { icon: MessageSquare, text: "Chat with sellers and dealers in one inbox" },
  { icon: BadgeCheck, text: "Free to post, no commission on your sale" },
];

/** Split layout for sign-in, sign-up and password reset: a photo panel on large screens, the form card beside it. */
export function AuthShell({ title, description, children, footer }: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="hero-backdrop relative min-h-[calc(100dvh-4rem)] overflow-hidden lg:min-h-[calc(100dvh-116px)]">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-[1320px] gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="relative hidden overflow-hidden rounded-[32px] bg-night lg:block">
          <Image src="/images/home/hero-bmw.jpg" alt="" fill sizes="50vw" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" aria-hidden />
          <div className="relative flex min-h-[560px] flex-col justify-end p-10 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">CarHat BD</p>
            <p className="mt-3 max-w-md text-4xl font-extrabold leading-[1.1]">Bangladesh&apos;s trusted place to buy and sell cars.</p>
            <ul className="mt-8 space-y-3">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] font-medium text-white/90">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Icon size={18} aria-hidden /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-7 shadow-float backdrop-blur-xl sm:p-9">
            <h1 className="text-3xl font-extrabold text-night">{title}</h1>
            {description && <div className="mt-2 text-[15px] text-slate-text">{description}</div>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-slate-text">{footer}</div>}
          <p className="mt-4 text-center text-xs text-slate-text">
            By continuing you agree to our <Link href="/terms" className="font-semibold hover:text-electric">Terms</Link> and{" "}
            <Link href="/privacy" className="font-semibold hover:text-electric">Privacy policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, autoComplete, hint, minLength }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; hint?: string; minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} type="password" className="field" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
        required minLength={minLength} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-text">{hint}</p>}
    </div>
  );
}
