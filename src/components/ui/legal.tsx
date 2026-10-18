import Link from "next/link";
import { CONTAINER, PageHero } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Privacy, terms and similar documents: a contents list beside readable long-form text. */
export function LegalPage({ eyebrow, title, updated, intro, sections }: {
  eyebrow: string; title: string; updated: string; intro: React.ReactNode; sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
        description={<p>Last updated {updated}</p>} />
      <div className={cn(CONTAINER, "grid gap-10 py-12 md:py-16 lg:grid-cols-[16rem_minmax(0,1fr)]")}>
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
            <p className="eyebrow">On this page</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}><a href={`#${s.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 text-slate-text hover:bg-mist hover:text-night"><span className="tabular">{i + 1}.</span>{s.title}</a></li>
              ))}
            </ol>
          </div>
        </nav>
        <article className="prose-car max-w-3xl rounded-3xl border border-hairline bg-white p-6 shadow-soft md:p-10">
          <div className="text-[18px] text-slate-text">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-36">
              <h2>{i + 1}. {s.title}</h2>
              {s.body}
            </section>
          ))}
          <p className="border-t border-hairline pt-6 text-[15px] text-slate-text">
            Questions? <Link href="/contact">Contact us</Link> and we&apos;ll help.
          </p>
        </article>
      </div>
    </>
  );
}
