import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function ContactPage() {
  const contactInfo = [
    { icon: Mail, label: "Email", value: "support@carhat.bd", href: "mailto:support@carhat.bd" },
    { icon: Phone, label: "Phone", value: "+880 1234-567890", href: "tel:+8801234567890" },
    { icon: MapPin, label: "Address", value: "123 Gulshan-2, Dhaka, Bangladesh", href: "#" },
    { icon: Clock, label: "Working Hours", value: "Sun - Thu, 9AM - 6PM", href: "#" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
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
                    className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary transition-colors group"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <item.icon size={20} className="text-primary" />
                    </div>
                    <p className="font-semibold mb-1">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </a>
                ))}
              </div>

              {/* Map placeholder */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-[200px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin size={32} className="mx-auto mb-2 text-primary" />
                  <p className="font-medium">Gulshan-2, Dhaka</p>
                  <p className="text-sm">Bangladesh</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
              <form className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
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
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
