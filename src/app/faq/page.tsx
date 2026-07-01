import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I create an account?",
        a: "Click 'Sign In' in the top navigation, then select 'Create Account'. Fill in your name, email, and password. You'll receive a verification email to activate your account.",
      },
      {
        q: "Is it free to list a car?",
        a: "Yes! Basic listings are completely free. We also offer premium Featured listings that appear at the top of search results for a small fee.",
      },
      {
        q: "Can I use CarHat.bd on my mobile phone?",
        a: "Absolutely! CarHat.bd is fully responsive and works beautifully on smartphones, tablets, and desktops.",
      },
    ],
  },
  {
    category: "Buying a Car",
    items: [
      {
        q: "How do I contact a seller?",
        a: "On each car's detail page, you'll find a 'Show Phone Number' button and a 'Chat with Seller' button. You must be logged in to use these features.",
      },
      {
        q: "Are the listings verified?",
        a: "We verify seller identities and encourage photo uploads. Look for the 'Verified Member' badge on seller profiles for added confidence.",
      },
      {
        q: "Can I negotiate the price?",
        a: "Yes! Prices listed are usually negotiable. Use the chat feature to discuss pricing directly with the seller.",
      },
    ],
  },
  {
    category: "Selling a Car",
    items: [
      {
        q: "How do I post a car for sale?",
        a: "Log in, click 'Sell Car' in the navigation, fill out the listing form with your car's details and photos, then submit. Your ad will go live after a quick review.",
      },
      {
        q: "How many photos can I upload?",
        a: "You can upload up to 20 high-quality photos per listing. We recommend including exterior, interior, engine, and document photos.",
      },
      {
        q: "How long will my listing stay active?",
        a: "Standard listings remain active for 30 days. You can renew them at any time from your dashboard.",
      },
    ],
  },
  {
    category: "Payments & Safety",
    items: [
      {
        q: "Is my payment information safe?",
        a: "We use Stripe, SSLCommerz, and PayPal with industry-standard PCI-DSS compliance for all transactions. Your financial data is never stored on our servers.",
      },
      {
        q: "What should I be careful about?",
        a: "Never pay in advance to a seller you don't know. Always meet in a public place, inspect the vehicle thoroughly, and verify all documents before completing a transaction.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <HelpCircle size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about using CarHat.bd
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ChevronDown size={20} className="text-primary" />
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              We&apos;re here to help. Reach out to our support team.
            </p>
            <a
              href="/contact"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
