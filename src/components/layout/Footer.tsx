import Link from "next/link";
import { Car, Globe, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t border-border relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight">CarHat.bd</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              The premier destination to buy, sell, and explore the best cars in Bangladesh.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Website"><Globe size={20} /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Email"><Mail size={20} /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Phone"><Phone size={20} /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Location"><MapPin size={20} /></a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cars" className="hover:text-primary transition-colors">Buy a Car</Link></li>
              <li><Link href="/sell" className="hover:text-primary transition-colors">Sell your Car</Link></li>
              <li><Link href="/dealers" className="hover:text-primary transition-colors">Find a Dealer</Link></li>
              <li><Link href="/reviews" className="hover:text-primary transition-colors">Car Reviews</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Dhaka, Bangladesh</li>
              <li>support@carhat.bd</li>
              <li>+880 1234-567890</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CarHat.bd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
