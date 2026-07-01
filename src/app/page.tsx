import Link from "next/link";
import {
  ChevronRight,
  Star,
  MapPin,
  Shield,
  Search as SearchIcon,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Gauge,
  Fuel,
  Quote,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";

export const dynamic = "force-dynamic";

const BRANDS = [
  { name: "Toyota", logo: "https://www.carlogos.org/car-logos/toyota-logo-2020-europe.png" },
  { name: "Honda", logo: "https://www.carlogos.org/car-logos/honda-logo-2000.png" },
  { name: "BMW", logo: "https://www.carlogos.org/car-logos/bmw-logo-2020.png" },
  { name: "Mercedes-Benz", logo: "https://www.carlogos.org/car-logos/mercedes-benz-logo-2011.png" },
  { name: "Nissan", logo: "https://www.carlogos.org/car-logos/nissan-logo-2020.png" },
  { name: "Hyundai", logo: "https://www.carlogos.org/car-logos/hyundai-logo-2011.png" },
  { name: "Audi", logo: "https://www.carlogos.org/car-logos/audi-logo-2016.png" },
  { name: "Lexus", logo: "https://www.carlogos.org/car-logos/lexus-logo-2013.png" },
  { name: "Kia", logo: "https://www.carlogos.org/car-logos/kia-logo-2021.png" },
  { name: "Mazda", logo: "https://www.carlogos.org/car-logos/mazda-logo-2018.png" },
  { name: "Volkswagen", logo: "https://www.carlogos.org/car-logos/volkswagen-logo-2019.png" },
  { name: "Mitsubishi", logo: "https://www.carlogos.org/car-logos/mitsubishi-logo-2000.png" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: SearchIcon,
    title: "Search & Discover",
    description: "Browse thousands of verified listings with our powerful real-time search and advanced filters.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Connect with Seller",
    description: "Chat directly with verified sellers, ask questions, and negotiate the best deal.",
  },
  {
    step: "03",
    icon: Shield,
    title: "Inspect & Verify",
    description: "Meet the seller, inspect the vehicle, verify documents, and get a professional checkup.",
  },
  {
    step: "04",
    icon: CreditCard,
    title: "Secure Payment",
    description: "Complete the transaction safely with Stripe, SSLCommerz, or PayPal integration.",
  },
];

const TESTIMONIALS = [
  {
    name: "Rahim Ahmed",
    role: "Car Buyer",
    content: "Found my dream Toyota Corolla Cross within 3 days. The real-time search and verified seller badges gave me complete confidence. Best car platform in Bangladesh!",
    rating: 5,
  },
  {
    name: "Fatima Khan",
    role: "Private Seller",
    content: "Sold my Honda Civic in just 48 hours! The listing process was incredibly simple and I received multiple serious inquiries. CarHat.bd is a game-changer.",
    rating: 5,
  },
  {
    name: "Kamal Hossain",
    role: "Dealer Partner",
    content: "As a certified dealer, the analytics dashboard and bulk upload feature have transformed my business. My sales increased by 40% in the first month. Highly recommended!",
    rating: 5,
  },
];

const WHY_CHOOSE_US = [
  { title: "Verified Sellers", desc: "Every seller is identity-verified for your safety." },
  { title: "Real Photos", desc: "High-quality photos uploaded by actual owners." },
  { title: "Instant Chat", desc: "Connect with sellers in real-time via our messaging system." },
  { title: "Price Transparency", desc: "Market-fair pricing with EMI calculator built-in." },
  { title: "Advanced Filters", desc: "Filter by brand, price, fuel, transmission, condition." },
  { title: "Secure Payments", desc: "Stripe, SSLCommerz, and PayPal for safe transactions." },
];

export default async function Home() {
  await connectToDatabase();
  const trendingCars = await Listing.find({ status: "active" })
    .sort({ views: -1 })
    .limit(8)
    .lean() as any[];

  const latestCars = await Listing.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean() as any[];

  const totalListings = await Listing.countDocuments({ status: "active" });

  return (
    <div className="flex flex-col">
      {/* ════════════════ HERO ════════════════ */}
      <section className="relative min-h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000')",
          }}
        />
        {/* Animated particles overlay */}
        <div className="absolute inset-0 z-10 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)",
        }} />

        <div className="relative z-20 text-center px-4 w-full max-w-5xl mx-auto">
          <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 animate-pulse">
            🚗 Bangladesh&apos;s #1 Car Marketplace
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Find Your <span className="text-primary">Dream Car</span> Today
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Search from {totalListings.toLocaleString()}+ verified listings. Buy, sell, and explore premium vehicles with confidence.
          </p>

          {/* Real-time Search */}
          <HeroSearchBar />

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mt-10 text-white/80 text-sm">
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-400" /> Verified Sellers</span>
            <span className="flex items-center gap-1"><Shield size={14} className="text-blue-400" /> Secure Platform</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-amber-400" /> 4.9 Rating</span>
          </div>
        </div>
      </section>

            {/* ════════════════ POPULAR BRANDS ════════════════ */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Browse by Brand</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Explore vehicles from the world&apos;s most trusted manufacturers
              </p>
            </div>
          </FadeInOnScroll>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {BRANDS.map((brand, i) => (
              <FadeInOnScroll key={brand.name} delay={i * 60}>
                <Link href={`/cars?make=${brand.name}`}>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all h-full group">
                    <div className="w-14 h-14 flex items-center justify-center mb-3 grayscale group-hover:grayscale-0 transition-all duration-300">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-sm font-medium text-center">{brand.name}</span>
                  </div>
                </Link>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

                  {/* ════════════════ TRENDING CARS ════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">🔥 Trending Cars</h2>
                <p className="text-muted-foreground">Most viewed vehicles this week</p>
              </div>
              <Link href="/cars" className="text-primary font-medium flex items-center hover:underline gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
          </FadeInOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCars.map((car: any, i: number) => (
              <FadeInOnScroll key={car._id.toString()} delay={i * 80}>
                <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full">
                  <Link href={`/cars/${car.slug}`}>
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded z-10">
                        FEATURED
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded capitalize z-10">
                        {car.condition}
                      </div>
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                        style={{ backgroundImage: `url(${car.images?.[0]})` }}
                      />
                    </div>
                  </Link>
                  <div className="p-5 flex-grow flex flex-col">
                    <Link href={`/cars/${car.slug}`}>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1 line-clamp-1">
                        {car.title}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-xs flex items-center gap-1 mb-3">
                      <MapPin size={12} /> {car.location}
                    </p>
                    <p className="text-xl font-extrabold text-primary mb-3">
                      ৳ {car.price?.toLocaleString()}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Gauge size={12} /> {car.mileage?.toLocaleString()} km</span>
                      <span className="flex items-center gap-1"><Fuel size={12} /> {car.fuelType}</span>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border">
                      <Link
                        href={`/cars/${car.slug}`}
                        className="block text-center w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section> 

      {/* ════════════════ ANIMATED STATS ════════════════ */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter end={totalListings || 14} suffix="+" label="Active Listings" />
            <AnimatedCounter end={50000} suffix="+" label="Happy Users" />
            <AnimatedCounter end={500} suffix="+" label="Verified Dealers" />
            <AnimatedCounter end={98} suffix="%" label="Satisfaction Rate" />
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInOnScroll>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Buy or sell a car in 4 simple steps
              </p>
            </div>
          </FadeInOnScroll>
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <FadeInOnScroll key={item.step} delay={i * 120}>
                <div className="relative text-center group">
                  {/* Connector line */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative">
                    <item.icon size={28} className="text-primary" />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ LATEST ARRIVALS ════════════════ */}
      {latestCars.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInOnScroll>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">⚡ Just Arrived</h2>
                  <p className="text-muted-foreground">Fresh listings added recently</p>
                </div>
                <Link href="/cars" className="text-primary font-medium flex items-center hover:underline gap-1">
                  View all <ChevronRight size={16} />
                </Link>
              </div>
            </FadeInOnScroll>
            <div className="grid md:grid-cols-2 gap-6">
              {latestCars.map((car: any, i: number) => (
                <FadeInOnScroll key={car._id.toString()} delay={i * 100}>
                  <Link href={`/cars/${car.slug}`} className="block">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group flex h-48">
                      <div className="w-1/3 overflow-hidden bg-muted relative">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                          style={{ backgroundImage: `url(${car.images?.[0]})` }}
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          NEW
                        </div>
                      </div>
                      <div className="flex-grow p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {car.title}
                          </h3>
                          <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {car.location}
                          </p>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-extrabold text-primary">৳ {car.price?.toLocaleString()}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span>{car.mileage?.toLocaleString()} km</span>
                              <span>•</span>
                              <span className="capitalize">{car.fuelType}</span>
                              <span>•</span>
                              <span className="capitalize">{car.transmission}</span>
                            </div>
                          </div>
                          <ArrowRight size={20} className="text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeInOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ WHY CHOOSE US ════════════════ */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInOnScroll>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose CarHat.bd?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                The safest and most convenient way to buy or sell a car in Bangladesh
              </p>
            </div>
          </FadeInOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {WHY_CHOOSE_US.map((item, i) => (
              <FadeInOnScroll key={item.title} delay={i * 80}>
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-sm group">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 size={20} className="text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInOnScroll>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">What Our Users Say</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Trusted by thousands of buyers, sellers, and dealers across Bangladesh
              </p>
            </div>
          </FadeInOnScroll>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FadeInOnScroll key={t.name} delay={i * 120}>
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all relative">
                  <Quote size={32} className="text-primary/10 absolute top-6 right-6" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} size={16} className="fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA SECTION ════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Find Your Perfect Car?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied users. Whether you&apos;re buying your first car or selling your current one, CarHat.bd makes it simple, safe, and fast.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/cars"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-xl shadow-primary/25 text-lg"
              >
                <SearchIcon size={20} /> Browse Cars
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center gap-2 bg-card border-2 border-border text-foreground px-10 py-4 rounded-full font-bold hover:border-primary hover:text-primary transition-colors text-lg"
              >
                Sell Your Car <ArrowRight size={20} />
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  );
}
