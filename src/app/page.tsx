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
  Heart,
  Eye,
  Camera,
  Zap,
  Filter,
  Lock,
  TrendingUp,
  Clock,
  Users,
  Award,
  Car,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

/* ═══════════════════════════════════════════════════════ */
/*  BRAND DATA — Using reliable SVG logo sources          */
/* ═══════════════════════════════════════════════════════ */
const BRANDS = [
  { name: "Toyota", logo: "/brands/toyota.svg" },
  { name: "Honda", logo: "/brands/honda.svg" },
  { name: "BMW", logo: "/brands/bmw.svg" },
  { name: "Mercedes-Benz", logo: "/brands/mercedes.svg" },
  { name: "Nissan", logo: "/brands/nissan.svg" },
  { name: "Hyundai", logo: "/brands/hyundai.svg" },
  { name: "Audi", logo: "/brands/audi.svg" },
  { name: "Lexus", logo: "/brands/lexus.svg" },
  { name: "Kia", logo: "/brands/kia.svg" },
  { name: "Mazda", logo: "/brands/mazda.svg" },
  { name: "Volkswagen", logo: "/brands/volkswagen.svg" },
  { name: "Mitsubishi", logo: "/brands/mitsubishi.svg" },
];

const FALLBACK_CAR_IMAGE = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: SearchIcon,
    title: "Search & Discover",
    description: "Browse thousands of verified listings with our powerful real-time search and advanced filters.",
    color: "from-violet-500 to-purple-600",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Connect with Seller",
    description: "Chat directly with verified sellers, ask questions, and negotiate the best deal.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "03",
    icon: Shield,
    title: "Inspect & Verify",
    description: "Meet the seller, inspect the vehicle, verify documents, and get a professional checkup.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    step: "04",
    icon: CreditCard,
    title: "Secure Payment",
    description: "Complete the transaction safely with Stripe, SSLCommerz, or PayPal integration.",
    color: "from-amber-500 to-orange-500",
  },
];

const TESTIMONIALS = [
  {
    name: "Rahim Ahmed",
    role: "Car Buyer",
    content: "Found my dream Toyota Corolla Cross within 3 days. The real-time search and verified seller badges gave me complete confidence. Best car platform in Bangladesh!",
    rating: 5,
    accent: "from-violet-500 to-purple-500",
  },
  {
    name: "Fatima Khan",
    role: "Private Seller",
    content: "Sold my Honda Civic in just 48 hours! The listing process was incredibly simple and I received multiple serious inquiries. CarHat.bd is a game-changer.",
    rating: 5,
    accent: "from-blue-500 to-cyan-500",
  },
  {
    name: "Kamal Hossain",
    role: "Dealer Partner",
    content: "As a certified dealer, the analytics dashboard and bulk upload feature have transformed my business. My sales increased by 40% in the first month. Highly recommended!",
    rating: 5,
    accent: "from-emerald-500 to-teal-500",
  },
];

const WHY_CHOOSE_US = [
  { title: "Verified Sellers", desc: "Every seller is identity-verified for your safety.", icon: Shield, color: "from-violet-500 to-purple-600" },
  { title: "Real Photos", desc: "High-quality photos uploaded by actual owners.", icon: Camera, color: "from-blue-500 to-cyan-500" },
  { title: "Instant Chat", desc: "Connect with sellers in real-time via our messaging system.", icon: Zap, color: "from-amber-500 to-orange-500" },
  { title: "Price Transparency", desc: "Market-fair pricing with EMI calculator built-in.", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
  { title: "Advanced Filters", desc: "Filter by brand, price, fuel, transmission, condition.", icon: Filter, color: "from-pink-500 to-rose-500" },
  { title: "Secure Payments", desc: "Stripe, SSLCommerz, and PayPal for safe transactions.", icon: Lock, color: "from-indigo-500 to-violet-500" },
];

export default async function Home() {
  let trendingCars: any[] = [];
  let latestCars: any[] = [];
  let totalListings = 0;

  try {
    await connectToDatabase();
    trendingCars = await Listing.find({ status: "active" })
      .sort({ views: -1 })
      .limit(8)
      .lean() as any[];

    latestCars = await Listing.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean() as any[];

    totalListings = await Listing.countDocuments({ status: "active" });
  } catch (error) {
    console.error("Failed to fetch data from MongoDB:", error);
  }

  return (
    <div className="flex flex-col">
      {/* ════════════════ HERO ════════════════ */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000')",
          }}
        />
        {/* Animated gradient overlays */}
        <div className="absolute inset-0 z-10 opacity-40" style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.1) 0%, transparent 50%)",
        }} />
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-float-slow z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-float z-10" />

        <div className="relative z-20 text-center px-4 w-full max-w-5xl mx-auto">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-6 badge-shimmer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white/90 font-medium text-sm tracking-wide">
              Bangladesh&apos;s #1 Car Marketplace
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-[1.05]">
            Find Your{" "}
            <span className="relative inline-block">
              <span className="gradient-text-animated">Dream Car</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8.5C50 2.5 100 2.5 150 6C200 9.5 250 4 298 7" stroke="url(#hero-underline)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="hero-underline" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#c084fc"/>
                    <stop offset="1" stopColor="#f472b6"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br className="hidden sm:block" />
            Today
          </h1>

          <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Search from <span className="text-white font-bold">{totalListings.toLocaleString()}+</span> verified listings. Buy, sell, and explore premium vehicles with confidence.
          </p>

          {/* Real-time Search */}
          <HeroSearchBar />

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-white/80 text-sm font-medium">Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <Shield size={14} className="text-blue-400" />
              <span className="text-white/80 text-sm font-medium">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <Star size={14} className="text-amber-400" />
              <span className="text-white/80 text-sm font-medium">4.9 Rating</span>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </section>

      {/* ════════════════ POPULAR BRANDS ════════════════ */}
      <section className="py-20 bg-background relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/3 rounded-full blur-[80px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInOnScroll>
            <div className="text-center mb-14">
              <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">Popular Brands</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Browse by Brand</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                Explore vehicles from the world&apos;s most trusted manufacturers
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-5">
            {BRANDS.map((brand, i) => (
              <FadeInOnScroll key={brand.name} delay={i * 50}>
                <Link href={`/cars?make=${brand.name}`}>
                  <div className="group relative bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 h-full card-hover card-glow">
                    {/* Gradient background on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative w-14 h-14 flex items-center justify-center mb-3 grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110">
                      <BrandLogo src={brand.logo} alt={brand.name} fallbackInitial={brand.name[0]} brandName={brand.name} />
                    </div>
                    <span className="relative text-sm font-semibold text-center group-hover:text-primary transition-colors duration-300">{brand.name}</span>
                  </div>
                </Link>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* ════════════════ TRENDING CARS ════════════════ */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 bg-primary/3 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeInOnScroll>
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">Most Popular</span>
                <h2 className="text-3xl md:text-5xl font-bold mb-2 flex items-center gap-3">
                  Trending Cars
                  <span className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full">
                    <TrendingUp size={14} /> Hot
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg">Most viewed vehicles this week</p>
              </div>
              <Link href="/cars" className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl">
                View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeInOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCars.map((car: any, i: number) => (
              <FadeInOnScroll key={car._id.toString()} delay={i * 80}>
                <div className="bg-card rounded-2xl border border-border overflow-hidden group flex flex-col h-full card-hover card-glow relative">
                  <Link href={`/cars/${car.slug}`}>
                    <div className="relative h-52 overflow-hidden bg-muted">
                      {/* Gradient overlay on image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 z-20 flex gap-2">
                        <span className="bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-primary/20 badge-shimmer">
                          FEATURED
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg capitalize z-20 border border-white/10">
                        {car.condition}
                      </div>

                      {/* Heart button */}
                      <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <div className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white hover:scale-110 transition-all shadow-lg">
                          <Heart size={16} className="text-gray-600 hover:text-red-500 transition-colors" />
                        </div>
                      </div>

                      {/* Image */}
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out"
                        style={{ backgroundImage: `url(${car.images?.[0] || FALLBACK_CAR_IMAGE})` }}
                      />
                    </div>
                  </Link>
                  <div className="p-5 flex-grow flex flex-col">
                    <Link href={`/cars/${car.slug}`}>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors duration-300 mb-1.5 line-clamp-1">
                        {car.title}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground text-xs flex items-center gap-1.5 mb-3">
                      <MapPin size={12} className="text-primary/60" /> {car.location}
                    </p>
                    <p className="text-2xl font-extrabold text-primary mb-3 price-tag">
                      ৳ {car.price?.toLocaleString()}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                        <Gauge size={12} className="text-primary/60" /> {car.mileage?.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                        <Fuel size={12} className="text-primary/60" /> {car.fuelType}
                      </span>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border">
                      <Link
                        href={`/cars/${car.slug}`}
                        className="group/btn block text-center w-full bg-gradient-to-r from-primary/5 to-purple-500/5 text-primary hover:from-primary hover:to-purple-600 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                      >
                        View Details <ArrowRight size={14} className="inline ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>

          {/* Mobile View All */}
          <div className="sm:hidden mt-8 text-center">
            <Link href="/cars" className="inline-flex items-center gap-2 text-primary font-semibold bg-primary/5 hover:bg-primary/10 px-6 py-3 rounded-xl transition-colors">
              View All Cars <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ ANIMATED STATS ════════════════ */}
      <section className="py-20 relative overflow-hidden bg-slate-950 border-y border-white/10">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/70 to-slate-950" />
        {/* Decorative glow orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-pink-500/15 rounded-full blur-[70px]" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <FadeInOnScroll>
            <div className="text-center mb-12">
              <span className="inline-block text-purple-300 text-xs font-bold tracking-widest uppercase mb-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                Marketplace Metrics
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">Trusted by Thousands</h2>
              <p className="text-purple-200 text-base md:text-lg font-medium">Real-time stats from Bangladesh&apos;s fastest growing car network</p>
            </div>
          </FadeInOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { end: totalListings || 14, suffix: "+", label: "Active Listings", icon: Car },
              { end: 50000, suffix: "+", label: "Happy Users", icon: Users },
              { end: 500, suffix: "+", label: "Verified Dealers", icon: Award },
              { end: 98, suffix: "%", label: "Satisfaction Rate", icon: Star },
            ].map((stat, i) => (
              <FadeInOnScroll key={stat.label} delay={i * 100}>
                <div className="relative group">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-center hover:bg-white/15 hover:border-white/25 transition-all duration-300 shadow-xl stat-glow">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md shadow-primary/30">
                      <stat.icon size={22} className="text-white" />
                    </div>
                    <AnimatedCounter end={stat.end} suffix={stat.suffix} label={stat.label} dark />
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 section-divider" />

        <div className="max-w-6xl mx-auto px-4">
          <FadeInOnScroll>
            <div className="text-center mb-16">
              <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">Simple Process</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                Buy or sell a car in 4 simple steps
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--primary) / 0.3) 0px, hsl(var(--primary) / 0.3) 8px, transparent 8px, transparent 16px)" }} />
            </div>

            {HOW_IT_WORKS.map((item, i) => (
              <FadeInOnScroll key={item.step} delay={i * 120}>
                <div className="relative text-center group">
                  <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 relative z-10 shadow-lg`}>
                    <item.icon size={28} className="text-white" />
                    <span className="absolute -top-2 -right-2 bg-card text-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md border border-border">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">{item.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ LATEST ARRIVALS ════════════════ */}
      {latestCars.length > 0 && (
        <section className="py-20 bg-muted/30 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeInOnScroll>
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">New Listings</span>
                  <h2 className="text-3xl md:text-5xl font-bold mb-2 flex items-center gap-3">
                    Just Arrived
                    <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 text-sm font-semibold px-3 py-1 rounded-full">
                      <Clock size={14} /> Fresh
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-lg">Fresh listings added recently</p>
                </div>
                <Link href="/cars" className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl">
                  View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </FadeInOnScroll>

            <div className="grid md:grid-cols-2 gap-6">
              {latestCars.map((car: any, i: number) => (
                <FadeInOnScroll key={car._id.toString()} delay={i * 100}>
                  <Link href={`/cars/${car.slug}`} className="block group">
                    <div className="bg-card rounded-2xl border border-border overflow-hidden group flex h-52 card-hover card-glow">
                      <div className="w-[38%] overflow-hidden bg-muted relative">
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out"
                          style={{ backgroundImage: `url(${car.images?.[0] || FALLBACK_CAR_IMAGE})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
                            NEW
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
                            {car.title}
                          </h3>
                          <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-1.5">
                            <MapPin size={12} className="text-primary/60" /> {car.location}
                          </p>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-2xl font-extrabold text-primary price-tag">৳ {car.price?.toLocaleString()}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1.5">
                              <span className="bg-muted/50 px-2 py-0.5 rounded">{car.mileage?.toLocaleString()} km</span>
                              <span className="bg-muted/50 px-2 py-0.5 rounded capitalize">{car.fuelType}</span>
                              <span className="bg-muted/50 px-2 py-0.5 rounded capitalize">{car.transmission}</span>
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <ArrowRight size={18} className="text-primary group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
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
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <FadeInOnScroll>
            <div className="text-center mb-16">
              <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">Why Us</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose CarHat.bd?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                The safest and most convenient way to buy or sell a car in Bangladesh
              </p>
            </div>
          </FadeInOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {WHY_CHOOSE_US.map((item, i) => (
              <FadeInOnScroll key={item.title} delay={i * 80}>
                <div className="bg-card border border-border rounded-2xl p-7 card-hover card-glow group relative overflow-hidden">
                  {/* Gradient accent on hover */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 shadow-md`}>
                    <item.icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-24 bg-muted/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/3 rounded-full blur-[80px]" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <FadeInOnScroll>
            <div className="text-center mb-16">
              <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-3">Testimonials</span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                Trusted by thousands of buyers, sellers, and dealers across Bangladesh
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <FadeInOnScroll key={t.name} delay={i * 120}>
                <div className="bg-card border border-border rounded-2xl p-8 card-hover relative overflow-hidden group">
                  {/* Top gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.accent}`} />

                  {/* Large quote mark */}
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                    <Quote size={20} className="text-primary/30" />
                  </div>

                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} size={16} className="fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-7">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-border pt-5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
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
      <section className="py-28 relative overflow-hidden bg-slate-950 border-t border-white/10">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/80 to-slate-950" />
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 border border-white/10 rounded-2xl rotate-12 animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-24 h-24 border border-white/10 rounded-full animate-float" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-pink-500/15 rounded-full blur-[80px]" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <FadeInOnScroll>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8 shadow-md">
              <Zap size={15} className="text-amber-300" />
              <span className="text-white text-sm font-semibold tracking-wide">Join 50,000+ happy car buyers & sellers</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Ready to Find Your{" "}
              <span className="gradient-text-animated block sm:inline mt-1 sm:mt-0">Perfect Car</span>?
            </h2>
            <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow-sm">
              Whether you&apos;re buying your first vehicle or selling to verified buyers, CarHat.bd makes it simple, transparent, and fast.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/cars"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary via-primary to-purple-600 text-white px-9 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 text-base md:text-lg"
              >
                <SearchIcon size={20} />
                Browse Cars
              </Link>
              <Link
                href="/sell"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-slate-900 hover:bg-slate-100 px-9 py-4 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 text-base md:text-lg shadow-xl"
              >
                Sell Your Car
                <ArrowRight size={20} className="text-primary" />
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  );
}
