import { Star, ThumbsUp, MessageSquare } from "lucide-react";

const reviews = [
  {
    author: "Rahim Ahmed",
    rating: 5,
    car: "2022 Toyota Corolla Cross",
    date: "2 weeks ago",
    content: "Excellent platform! Found my dream car within a week. The seller was verified and the entire process was smooth. Highly recommend CarHat.bd to anyone looking for a reliable car marketplace.",
  },
  {
    author: "Fatima Khan",
    rating: 4,
    car: "2021 Honda Civic RS",
    date: "1 month ago",
    content: "Great selection of cars and the filter system is very useful. I was able to narrow down exactly what I wanted. The chat feature made it easy to communicate with sellers.",
  },
  {
    author: "Kamal Hossain",
    rating: 5,
    car: "2020 Hyundai Tucson",
    date: "3 weeks ago",
    content: "Sold my car in just 3 days! The listing process was simple and I got multiple inquiries within hours. The best car selling platform in Bangladesh.",
  },
  {
    author: "Nusrat Jahan",
    rating: 4,
    car: "2019 Nissan X-Trail",
    date: "2 months ago",
    content: "Used CarHat.bd to buy my first car. The detailed specifications and photos helped me make an informed decision. Would definitely use it again.",
  },
  {
    author: "Tariq Islam",
    rating: 5,
    car: "2023 BMW 5 Series",
    date: "1 week ago",
    content: "As a dealer, CarHat.bd has transformed my business. The analytics dashboard helps me understand which listings perform best. Premium experience all around.",
  },
  {
    author: "Ayesha Begum",
    rating: 5,
    car: "2022 Mercedes-Benz C-Class",
    date: "3 days ago",
    content: "The verified seller badges give me confidence. I purchased a premium car and the entire experience was professional. Love the modern UI of this platform!",
  },
];

export default function ReviewsPage() {
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <MessageSquare size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Car Reviews</h1>
          <p className="text-lg text-muted-foreground mb-6">
            See what our community says about their buying and selling experience
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={24} className="fill-amber-500 text-amber-500" />
              ))}
            </div>
            <span className="text-2xl font-bold">{avgRating}</span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors flex flex-col">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s < review.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow">
                  &ldquo;{review.content}&rdquo;
                </p>
                <div className="border-t border-border pt-4 mt-auto">
                  <p className="font-semibold">{review.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.car} &bull; {review.date}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Write Review CTA */}
          <div className="mt-12 text-center">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm inline-block">
              <ThumbsUp size={32} className="mx-auto text-primary mb-3" />
              <h3 className="text-xl font-bold mb-2">Share Your Experience</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Bought or sold a car through CarHat.bd? We&apos;d love to hear about your experience.
              </p>
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Write a Review
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
