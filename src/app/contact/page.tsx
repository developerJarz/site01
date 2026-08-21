"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: settings.contactEmail || "support@carhat.bd",
      href: `mailto:${settings.contactEmail || "support@carhat.bd"}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: settings.supportPhone || "+880 1700-000000",
      href: `tel:${settings.supportPhone || "+8801700000000"}`,
    },
    {
      icon: MapPin,
      label: "Address",
      value: settings.address || "Plot 12, Road 11, Block C, Gulshan-2, Dhaka 1212, Bangladesh",
      href: settings.googleMapsUrl || "https://maps.google.com/?q=Gulshan-2,Dhaka,Bangladesh",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: settings.workingHours || "Sat - Thu: 9:00 AM - 8:00 PM (Friday Closed)",
      href: "#",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have questions about buying, selling, or dealership partnerships? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary transition-all group"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <item.icon size={20} className="text-primary" />
                    </div>
                    <p className="font-semibold mb-1">{item.label}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.value}</p>
                  </a>
                ))}
              </div>

              {/* Map Box */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Our Headquarters</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {settings.address || "Gulshan-2, Dhaka 1212, Bangladesh"}
                    </p>
                  </div>
                </div>
                <a
                  href={settings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(settings.address || "Gulshan-2, Dhaka, Bangladesh")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 text-sm font-semibold transition-colors"
                >
                  <ExternalLink size={16} /> Open in Google Maps
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Message Sent Successfully!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Thank you for reaching out. Our support team will review your message and get back to you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Subject</label>
                    <select className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all">
                      <option>General Inquiry</option>
                      <option>Report a Listing</option>
                      <option>Technical Support</option>
                      <option>Dealer Partnership</option>
                      <option>Advertising</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Write your message here..."
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
