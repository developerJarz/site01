import { Building2, Upload, BarChart3, Users, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DealersPage() {
  const benefits = [
    {
      icon: Upload,
      title: "Bulk Upload",
      description: "Upload multiple car listings at once using our CSV template. Save time and manage inventory efficiently.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track impressions, leads, and conversion rates for every listing. Make data-driven decisions.",
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Add team members, assign roles, and manage your dealership operations from one dashboard.",
    },
    {
      icon: Phone,
      title: "Priority Support",
      description: "Get dedicated account management and priority customer support for your dealership.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      features: ["Up to 10 listings", "Basic analytics", "Email support", "Standard visibility"],
      highlighted: false,
    },
    {
      name: "Professional",
      price: "৳ 5,000",
      period: "/month",
      features: ["Up to 100 listings", "Advanced analytics", "Priority support", "Featured listings", "Bulk upload", "Team access (3 members)"],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "৳ 15,000",
      period: "/month",
      features: ["Unlimited listings", "Custom analytics", "Dedicated manager", "Premium placement", "API access", "Unlimited team members"],
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Building2 size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Dealer Portal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join Bangladesh&apos;s fastest-growing car marketplace. Manage your inventory, track leads, and grow your business with CarHat.bd.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Register as Dealer <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Why Partner With Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <benefit.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4 text-center">Dealer Plans</h2>
          <p className="text-muted-foreground text-center mb-12">
            Choose the plan that fits your dealership size
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-2xl p-8 shadow-sm flex flex-col ${
                  plan.highlighted
                    ? "border-primary ring-2 ring-primary/20 relative"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
