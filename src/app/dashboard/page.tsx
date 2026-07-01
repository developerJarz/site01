"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LogOut,
  PlusCircle,
  Eye,
  Car,
  CheckCircle2,
  ShoppingBag,
  Loader2,
  ExternalLink,
  Settings,
  Shield,
  TrendingUp,
  Heart,
  Star,
  Clock,
  BarChart3,
  MessageSquare,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Zap,
  BookOpen,
  Users,
  Package,
} from "lucide-react";

interface Listing {
  _id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  views: number;
  images: string[];
  createdAt: string;
  condition: string;
}

interface DashboardData {
  user: any;
  profileCompleteness: number;
  stats: {
    total: number;
    active: number;
    sold: number;
    pending: number;
    totalViews: number;
  };
  favoritesCount: number;
  reviewsCount: number;
  recentListings: Listing[];
  adminStats: {
    totalUsers: number;
    totalListings: number;
    totalBlogs: number;
  } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const role = user?.role || "buyer";
  const isAdmin = role === "admin";
  const isSeller = role === "seller" || role === "dealer";

  const stats = data?.stats || { total: 0, active: 0, sold: 0, pending: 0, totalViews: 0 };

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    pending: "bg-amber-500/10 text-amber-600",
    sold: "bg-blue-500/10 text-blue-600",
    removed: "bg-red-500/10 text-red-600",
  };

  const roleLabels: Record<string, string> = {
    buyer: "Buyer",
    seller: "Seller",
    dealer: "Dealer",
    admin: "Administrator",
    guest: "Guest",
  };

  const roleColors: Record<string, string> = {
    buyer: "from-emerald-500 to-teal-600",
    seller: "from-blue-500 to-indigo-600",
    dealer: "from-purple-500 to-violet-600",
    admin: "from-red-500 to-rose-600",
    guest: "from-gray-400 to-gray-500",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 bg-gradient-to-br ${roleColors[role] || roleColors.buyer} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${roleColors[role] || roleColors.buyer} text-white px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                {role === "admin" && <Shield size={10} />}
                {roleLabels[role] || role}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm shadow-lg shadow-red-500/20"
            >
              <Shield size={16} /> Admin Panel
            </Link>
          )}
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors text-sm"
          >
            <Settings size={16} /> Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-medium hover:bg-destructive/20 transition-colors text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Profile Completeness */}
      {data && data.profileCompleteness < 100 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              <h3 className="font-semibold text-sm">Complete Your Profile</h3>
            </div>
            <Link href="/profile" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              Update Now <ChevronRight size={12} />
            </Link>
          </div>
          <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${data.profileCompleteness}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your profile is {data.profileCompleteness}% complete. A complete profile helps build trust with other users.
          </p>
        </div>
      )}

      {/* Admin Platform Stats */}
      {isAdmin && data?.adminStats && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={14} /> Platform Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/admin/users" className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-blue-500" />
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold">{data.adminStats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </Link>
            <Link href="/admin/listings" className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-emerald-500" />
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold">{data.adminStats.totalListings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Listings</p>
            </Link>
            <Link href="/admin/blogs" className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-purple-500/5 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-500" />
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold">{data.adminStats.totalBlogs.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Blog Posts</p>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
            <Car size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Listings</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active Ads</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
            <Clock size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
            <ShoppingBag size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{stats.sold}</p>
          <p className="text-xs text-muted-foreground">Sold Cars</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center mb-3">
            <Eye size={20} className="text-pink-500" />
          </div>
          <p className="text-2xl font-bold">{stats.totalViews}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>
      </div>

      {/* Quick Actions + Side Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/sell"
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all group"
          >
            <PlusCircle
              size={28}
              className="text-primary mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-bold text-lg mb-1">Post a New Ad</h3>
            <p className="text-sm text-muted-foreground">
              List your vehicle with photos & documents
            </p>
          </Link>
          <Link
            href="/cars"
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <TrendingUp
              size={28}
              className="text-primary mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-bold text-lg mb-1">Browse Cars</h3>
            <p className="text-sm text-muted-foreground">
              Explore the marketplace
            </p>
          </Link>
          <Link
            href="/profile"
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <Settings
              size={28}
              className="text-primary mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-bold text-lg mb-1">Account Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update profile &amp; preferences
            </p>
          </Link>
          <Link
            href="/blog"
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <BookOpen
              size={28}
              className="text-primary mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-bold text-lg mb-1">Read Blog</h3>
            <p className="text-sm text-muted-foreground">
              Tips, guides &amp; car news
            </p>
          </Link>
          <Link
            href="/dashboard/messages"
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <MessageSquare
              size={28}
              className="text-primary mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-bold text-lg mb-1">Messages</h3>
            <p className="text-sm text-muted-foreground">
              Chat with buyers &amp; sellers
            </p>
          </Link>
        </div>

        {/* Side Info Cards */}
        <div className="space-y-4">
          {/* Favorites */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Heart size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data?.favoritesCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Saved Favorites</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data?.reviewsCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Account Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {data?.user?.isVerified ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Listings */}
      <div className="bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Car size={18} className="text-primary" />
            My Listings
          </h2>
          <Link
            href="/sell"
            className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
          >
            <PlusCircle size={14} /> New
          </Link>
        </div>

        {(!data?.recentListings || data.recentListings.length === 0) ? (
          <div className="p-12 text-center">
            <Car size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">
              {role === "buyer"
                ? "Browse the marketplace to find your perfect car!"
                : "Start by posting your first car ad!"}
            </p>
            <Link
              href={role === "buyer" ? "/cars" : "/sell"}
              className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              {role === "buyer" ? "Browse Cars" : "Post an Ad"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentListings.map((listing) => (
              <div
                key={listing._id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={
                      listing.images?.[0] ||
                      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=60&w=120"
                    }
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium truncate">{listing.title}</p>
                  <p className="text-sm text-primary font-bold">
                    ৳ {listing.price?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye size={12} /> {listing.views}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                      statusColor[listing.status] || ""
                    }`}
                  >
                    {listing.status}
                  </span>
                  <Link
                    href={`/cars/${listing.slug}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
