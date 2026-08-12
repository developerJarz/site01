"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  BarChart3,
  TrendingUp,
  Car,
  Fuel,
  Palette,
  DollarSign,
  Users,
} from "lucide-react";

interface ReportData {
  byCondition: { _id: string; count: number }[];
  byFuelType: { _id: string; count: number }[];
  byMake: { _id: string; count: number; avgPrice: number }[];
  priceRanges: { _id: any; count: number }[];
  byStatus: { _id: string; count: number }[];
  byRole: { _id: string; count: number }[];
  monthlyUsers: { _id: { year: number; month: number }; count: number }[];
  monthlyListings: { _id: { year: number; month: number }; count: number }[];
  topPerforming: {
    _id: string;
    title: string;
    price: number;
    views: number;
    slug: string;
  }[];
}

const COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
];

const BAR_COLORS = [
  "from-violet-500 to-violet-600",
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
  "from-orange-500 to-orange-600",
  "from-teal-500 to-teal-600",
  "from-rose-500 to-rose-600",
  "from-indigo-500 to-indigo-600",
];

const priceLabel = (id: any) => {
  if (id === "20000000+") return "৳2Cr+";
  const num = Number(id);
  if (num === 0) return "Under ৳10L";
  if (num < 10000000) return `৳${(num / 100000).toFixed(0)}L`;
  return `৳${(num / 10000000).toFixed(0)}Cr`;
};

const priceRangeLabel = (id: any) => {
  if (id === "20000000+") return "Above ৳2 Crore";
  const rangeMap: Record<number, string> = {
    0: "Under ৳10 Lakh",
    1000000: "৳10L — ৳20L",
    2000000: "৳20L — ৳30L",
    3000000: "৳30L — ৳50L",
    5000000: "৳50L — ৳70L",
    7000000: "৳70L — ৳1Cr",
    10000000: "৳1Cr — ৳2Cr",
  };
  return rangeMap[Number(id)] || `৳${Number(id).toLocaleString()}`;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load reports data.
      </div>
    );
  }

  const maxMake = Math.max(...data.byMake.map((m) => m.count), 1);
  const maxPriceRange = Math.max(...data.priceRanges.map((p) => p.count), 1);
  const totalListings = data.byCondition.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 size={28} className="text-primary" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Marketplace insights and performance metrics
        </p>
      </div>

      {/* Top Row: Condition + Fuel Type + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* By Condition */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car size={18} className="text-primary" />
            <h3 className="font-bold text-lg">By Condition</h3>
          </div>
          <div className="space-y-3">
            {data.byCondition.map((item, i) => (
              <div key={item._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{item._id}</span>
                  <span className="text-muted-foreground">
                    {item.count}{" "}
                    <span className="text-xs">
                      ({((item.count / totalListings) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700`}
                    style={{
                      width: `${(item.count / totalListings) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Fuel Type */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Fuel size={18} className="text-primary" />
            <h3 className="font-bold text-lg">By Fuel Type</h3>
          </div>
          <div className="space-y-3">
            {data.byFuelType.map((item, i) => (
              <div key={item._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{item._id}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${BAR_COLORS[(i + 2) % BAR_COLORS.length]} transition-all duration-700`}
                    style={{
                      width: `${(item.count / totalListings) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={18} className="text-primary" />
            <h3 className="font-bold text-lg">By Status</h3>
          </div>
          <div className="space-y-3">
            {data.byStatus.map((item, i) => {
              const statusColors: Record<string, string> = {
                active: "from-green-500 to-green-600",
                pending: "from-amber-500 to-amber-600",
                sold: "from-blue-500 to-blue-600",
                removed: "from-red-500 to-red-600",
              };
              return (
                <div key={item._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{item._id}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${statusColors[item._id] || BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700`}
                      style={{
                        width: `${(item.count / totalListings) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Makes / Brands */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="font-bold text-lg">Top Makes / Brands</h3>
        </div>
        <div className="space-y-4">
          {data.byMake.map((item, i) => (
            <div key={item._id} className="flex items-center gap-4">
              <span className="w-28 text-sm font-medium truncate flex-shrink-0">
                {item._id}
              </span>
              <div className="flex-grow">
                <div className="w-full bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-6 rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700 flex items-center`}
                    style={{
                      width: `${Math.max((item.count / maxMake) * 100, 15)}%`,
                    }}
                  >
                    <span className="text-white text-xs font-bold ml-3">
                      {item.count} listing{item.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 w-24 text-right price-display">
                Avg: ৳{Math.round(item.avgPrice).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Distribution */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign size={18} className="text-primary" />
          <h3 className="font-bold text-lg">Price Distribution</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {data.priceRanges.map((item, i) => (
            <div
              key={i}
              className="bg-muted/30 border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} mx-auto mb-2 flex items-center justify-center`}
              >
                <span className="text-white text-xs font-bold">
                  {item.count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {priceRangeLabel(item._id)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Users by Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h3 className="font-bold text-lg">Users by Role</h3>
          </div>
          <div className="space-y-3">
            {data.byRole.map((item, i) => {
              const roleColors: Record<string, string> = {
                admin: "from-red-500 to-red-600",
                dealer: "from-purple-500 to-purple-600",
                seller: "from-blue-500 to-blue-600",
                buyer: "from-green-500 to-green-600",
                guest: "from-gray-500 to-gray-600",
              };
              const totalUsers = data.byRole.reduce((s, r) => s + r.count, 0);
              return (
                <div key={item._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{item._id}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({((item.count / totalUsers) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${roleColors[item._id] || BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700`}
                      style={{
                        width: `${(item.count / totalUsers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Listings */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary" />
            <h3 className="font-bold text-lg">Top Performing</h3>
          </div>
          <div className="space-y-3">
            {data.topPerforming.map((item, i) => (
              <div
                key={item._id}
                className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border hover:border-primary/20 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-r ${BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                >
                  #{i + 1}
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground price-display">
                    ৳{item.price.toLocaleString()} · {item.views.toLocaleString()} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
