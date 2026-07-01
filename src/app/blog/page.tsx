export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";
import { Calendar, Eye, ArrowRight, BookOpen } from "lucide-react";

export default async function BlogArchivePage() {
  await connectToDatabase();
  const blogs = await Blog.find({ published: true })
    .sort({ createdAt: -1 })
    .lean() as any[];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <BookOpen size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            CarHat Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Expert tips, buying guides, and the latest automotive news from
            Bangladesh&apos;s premier car marketplace.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {blogs.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <BookOpen
                size={48}
                className="mx-auto text-muted-foreground/30 mb-4"
              />
              <h3 className="text-xl font-bold mb-2">No blog posts yet</h3>
              <p className="text-muted-foreground">
                Check back soon for the latest automotive news and guides.
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post (first one) */}
              {blogs[0] && (
                <Link
                  href={`/blog/${blogs[0].slug}`}
                  className="block mb-12 group"
                >
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                    <div className="grid md:grid-cols-2">
                      <div className="h-64 md:h-auto overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700 min-h-[300px]"
                          style={{
                            backgroundImage: `url(${blogs[0].coverImage})`,
                          }}
                        />
                      </div>
                      <div className="p-8 flex flex-col justify-center">
                        <div className="flex gap-2 mb-3">
                          {blogs[0].tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {blogs[0].title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {blogs[0].excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />{" "}
                            {new Date(blogs[0].createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={14} /> {blogs[0].views} views
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-primary font-medium mt-4 group-hover:gap-2 transition-all">
                          Read Article <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest of the posts */}
              {blogs.length > 1 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogs.slice(1).map((blog: any) => (
                    <Link
                      href={`/blog/${blog.slug}`}
                      key={blog._id}
                      className="group"
                    >
                      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
                        <div className="h-48 overflow-hidden">
                          <div
                            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                            style={{
                              backgroundImage: `url(${blog.coverImage})`,
                            }}
                          />
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex gap-2 mb-3">
                            {blog.tags?.slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                            {blog.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />{" "}
                              {new Date(blog.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {blog.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
