import { Car, Users, Shield, TrendingUp, Globe, Award } from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Active Listings", value: "10,000+", icon: Car },
    { label: "Happy Users", value: "50,000+", icon: Users },
    { label: "Verified Dealers", value: "500+", icon: Shield },
    { label: "Monthly Visitors", value: "200K+", icon: TrendingUp },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Every listing is verified. We use badge systems and identity checks to ensure a safe marketplace.",
    },
    {
      icon: Globe,
      title: "Nationwide Reach",
      description: "From Dhaka to Chattogram, Sylhet to Khulna — CarHat.bd connects buyers and sellers across all of Bangladesh.",
    },
    {
      icon: Award,
      title: "Premium Experience",
      description: "Advanced search filters, high-quality photos, instant chat, and secure payments for a seamless experience.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About CarHat.bd</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bangladesh&apos;s premier online marketplace for buying and selling cars.
            Our mission is to make the car-shopping experience safe, transparent,
            and enjoyable for everyone.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
                <stat.icon size={28} className="mx-auto text-primary mb-3" />
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-4 text-muted-foreground leading-relaxed">
            <p>
              CarHat.bd was founded with a simple vision: to create the most trusted and
              user-friendly automotive marketplace in Bangladesh. We noticed that buying
              and selling cars was often a stressful, opaque process filled with uncertainty.
            </p>
            <p>
              We set out to change that by building a platform where transparency, safety,
              and convenience come first. Every listing on CarHat.bd goes through our
              verification process. Our advanced search tools let you find exactly the car
              you want, and our secure messaging system keeps your personal information safe.
            </p>
            <p>
              Today, CarHat.bd connects thousands of buyers, sellers, and certified dealers
              every day — and we&apos;re just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
