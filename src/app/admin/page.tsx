"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Car,
  Eye,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  soldListings: number;
  totalViews: number;
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
}

interface RecentListing {
  _id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  slug: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [topViewed, setTopViewed] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentListings(data.recentListings);
        setTopViewed(data.topViewed);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Listings", value: stats?.totalListings || 0, icon: Car, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Listings", value: stats?.activeListings || 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Pending Review", value: stats?.pendingListings || 0, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Sold Cars", value: stats?.soldListings || 0, icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Total Views", value: stats?.totalViews || 0, icon: Eye, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    pending: "bg-amber-500/10 text-amber-600",
    sold: "bg-blue-500/10 text-blue-600",
    removed: "bg-red-500/10 text-red-600",
  };

  const roleColor: Record<string, string> = {
    admin: "bg-red-500/10 text-red-600",
    dealer: "bg-purple-500/10 text-purple-600",
    seller: "bg-blue-500/10 text-blue-600",
    buyer: "bg-green-500/10 text-green-600",
    guest: "bg-gray-500/10 text-gray-600",
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your marketplace performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <h2 className="font-bold text-lg">Recent Users</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.map((user) => (
              <div key={user._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColor[user.role] || "bg-gray-500/10 text-gray-600"}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-primary" />
              <h2 className="font-bold text-lg">Recent Listings</h2>
            </div>
            <Link
              href="/admin/listings"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentListings.map((listing) => (
              <div key={listing._id} className="px-6 py-4 flex items-center justify-between">
                <div className="min-w-0 flex-grow">
                  <p className="font-medium text-sm truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ৳ {listing.price.toLocaleString()} · {listing.views} views
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ml-3 ${statusColor[listing.status] || ""}`}>
                  {listing.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Viewed */}
      <div className="bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="font-bold text-lg">Top Viewed Listings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Views</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topViewed.map((listing, i) => (
                <tr key={listing._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-4 font-medium">{listing.title}</td>
                  <td className="px-6 py-4 text-primary font-semibold">
                    ৳ {listing.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1">
                      <Eye size={14} className="text-muted-foreground" />
                      {listing.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/cars/${listing.slug}`}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
