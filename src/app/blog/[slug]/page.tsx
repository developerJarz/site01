export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Eye,
  ArrowLeft,
  User as UserIcon,
  Tag,
  Share2,
} from "lucide-react";

export default async function BlogPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  await connectToDatabase();
  const blog = (await Blog.findOne({ slug, published: true }).lean()) as any;

  if (!blog) {
    notFound();
  }

  // Increment view count
  Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).exec();

  // Get related posts
  const related = (await Blog.find({
    published: true,
    _id: { $ne: blog._id },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("title slug coverImage excerpt createdAt tags")
    .lean()) as any[];

  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Split content into paragraphs
  const paragraphs = blog.content
    .split("\n")
    .filter((p: string) => p.trim());

  return (
    <div className="flex flex-col">
      {/* Hero Cover */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${blog.coverImage})` }}
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-4">
              {blog.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <UserIcon size={14} /> {blog.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={14} /> {(blog.views || 0) + 1} views
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/blog"
              className="hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">
              {blog.title}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Content */}
            <article className="flex-grow">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <p className="text-lg text-muted-foreground font-medium mb-8 leading-relaxed border-l-4 border-primary pl-4 italic">
                  {blog.excerpt}
                </p>
                <div className="prose prose-lg dark:prose-invert max-w-none space-y-5">
                  {paragraphs.map((para: string, i: number) => (
                    <p
                      key={i}
                      className="text-muted-foreground leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-6 flex-wrap">
                  <Tag size={16} className="text-muted-foreground" />
                  {blog.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Share2 size={16} />
                <span>Share this article</span>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Author */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold mb-4">About the Author</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
                      {blog.author[0]}
                    </div>
                    <div>
                      <p className="font-medium">{blog.author}</p>
                      <p className="text-xs text-muted-foreground">
                        Automotive Writer
                      </p>
                    </div>
                  </div>
                </div>

                {/* Related Posts */}
                {related.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Related Posts</h3>
                    <div className="space-y-4">
                      {related.map((post: any) => (
                        <Link
                          href={`/blog/${post.slug}`}
                          key={post._id}
                          className="flex gap-3 group"
                        >
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <div
                              className="w-full h-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${post.coverImage})`,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(
                                post.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Back */}
                <Link
                  href="/blog"
                  className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <ArrowLeft size={16} /> Back to all posts
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
