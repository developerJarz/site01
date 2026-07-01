import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Lock size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">Last updated: June 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Personal information (name, email, phone number) during registration.</li>
                <li>Vehicle listing details (make, model, year, photos, description).</li>
                <li>Communication data when you contact sellers or our support team.</li>
                <li>Usage data (pages visited, search queries, device information).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide, maintain, and improve our marketplace services.</li>
                <li>To process your listings and connect you with buyers or sellers.</li>
                <li>To send notifications about your account and listings.</li>
                <li>To detect and prevent fraud, abuse, and security incidents.</li>
                <li>To analyze usage patterns and improve user experience.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is securely stored in MongoDB Atlas with enterprise-grade encryption.
                We use HTTPS for all data transmission and bcrypt for password hashing.
                NextAuth.js manages secure session tokens. We implement industry-standard
                security measures to protect your personal information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">4. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies for session management (NextAuth.js) and analytics.
                Essential cookies are required for the platform to function. You can
                control cookie preferences through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">5. Third-Party Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal data to third parties. We may share data
                with trusted service providers (payment processors, cloud hosting)
                solely for the purpose of operating our platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Access your personal data at any time from your dashboard.</li>
                <li>Request correction of inaccurate information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of marketing communications.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active. If you delete
                your account, we will remove your personal data within 30 days, except
                where we are required by law to retain it.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Questions about privacy? Please{" "}
                <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
