import Link from "next/link";
import { ArrowRight, CalendarDays, Eye } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { cn } from "@/lib/utils";

export type BlogSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  tags?: string[];
  views?: number;
  createdAt: string;
};

const date = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function BlogCard({ post, featured, className }: { post: BlogSummary; featured?: boolean; className?: string }) {
  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-electric/20 hover:shadow-float motion-reduce:hover:translate-y-0",
      featured && "md:grid md:grid-cols-2", className)}>
      <div className={cn("relative overflow-hidden bg-mist", featured ? "aspect-[16/10] md:aspect-auto md:min-h-[340px]" : "aspect-[16/10]")}>
        <CarImage src={post.coverImage} alt="" sizes={featured ? "(min-width: 768px) 640px, 92vw" : "(min-width: 1024px) 400px, (min-width: 768px) 45vw, 92vw"}
          priority={featured} className="transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100" />
      </div>
      <div className={cn("flex grow flex-col p-6", featured && "md:justify-center md:p-10")}>
        {!!post.tags?.length && (
          <ul className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => <li key={t} className="rounded-full bg-haze px-2.5 py-1 text-xs font-semibold capitalize text-electric-deep">{t}</li>)}
          </ul>
        )}
        <h3 className={cn("mt-3 font-extrabold text-night", featured ? "text-2xl md:text-[2rem] md:leading-tight" : "line-clamp-2 text-lg")}>
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-electric">{post.title}</Link>
        </h3>
        <p className={cn("mt-2 text-[15px] leading-relaxed text-slate-text", featured ? "line-clamp-4" : "line-clamp-3")}>{post.excerpt}</p>
        <p className="mt-auto flex items-center gap-4 pt-5 text-[13px] text-slate-text">
          <span className="inline-flex items-center gap-1"><CalendarDays size={14} aria-hidden /> {date(post.createdAt)}</span>
          {post.views !== undefined && <span className="inline-flex items-center gap-1 tabular"><Eye size={14} aria-hidden /> {post.views.toLocaleString("en-IN")}</span>}
          {featured && <span className="ml-auto inline-flex items-center gap-1 font-bold text-electric">Read <ArrowRight size={15} aria-hidden /></span>}
        </p>
      </div>
    </article>
  );
}
