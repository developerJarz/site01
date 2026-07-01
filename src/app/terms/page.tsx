import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <FileText size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">Last updated: June 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using CarHat.bd, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you should not use our platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">2. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You must provide accurate, complete information when creating an account.
                You are responsible for maintaining the security of your account and password.
                CarHat.bd cannot and will not be liable for any loss or damage from your failure
                to comply with this security obligation.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Listing Guidelines</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All listings must be truthful and accurate.</li>
                <li>You must be the legal owner or authorized seller of the vehicle listed.</li>
                <li>Misleading descriptions, fake photos, or fraudulent listings are strictly prohibited.</li>
                <li>CarHat.bd reserves the right to remove any listing that violates these guidelines.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">4. Transactions</h2>
              <p className="text-muted-foreground leading-relaxed">
                CarHat.bd acts solely as a platform connecting buyers and sellers. We are not a party
                to any transaction between users. All transactions are conducted at the users&apos; own
                risk. Users are responsible for complying with local vehicle registration and transfer regulations.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">5. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Using the platform for illegal activities or fraud.</li>
                <li>Harassing or threatening other users.</li>
                <li>Posting spam, malware, or deceptive content.</li>
                <li>Attempting to circumvent security features.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                CarHat.bd shall not be liable for any indirect, incidental, or consequential damages
                arising from the use of the platform. We do not guarantee the accuracy of listings
                or the quality of vehicles sold through our platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">7. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be posted on
                this page with an updated revision date. Continued use of the platform after changes
                constitutes acceptance of the new terms.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                If you have any questions about these Terms of Service, please{" "}
                <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
