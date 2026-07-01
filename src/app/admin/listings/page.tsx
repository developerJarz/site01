"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  ExternalLink,
  Star,
  Eye,
  Pencil,
  X,
  Save,
  Car,
} from "lucide-react";

interface Listing {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engineSize: number;
  color: string;
  location: string;
  views: number;
  status: string;
  featured: boolean;
  images: string[];
  features: string[];
  createdAt: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface EditFormData {
  title: string;
  description: string;
  price: number;
  condition: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engineSize: number;
  color: string;
  location: string;
  status: string;
  featured: boolean;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/admin/listings");
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const openEditForm = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title,
      description: listing.description || "",
      price: listing.price,
      condition: listing.condition,
      make: listing.make || "",
      model: listing.model || "",
      year: listing.year || new Date().getFullYear(),
      mileage: listing.mileage || 0,
      fuelType: listing.fuelType || "petrol",
      transmission: listing.transmission || "manual",
      engineSize: listing.engineSize || 0,
      color: listing.color || "",
      location: listing.location || "",
      status: listing.status,
      featured: listing.featured,
    });
  };

  const closeEditForm = () => {
    setEditingListing(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editingListing || !editForm) return;
    setActionLoading(editingListing._id);
    try {
      await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingListing._id, ...editForm }),
      });
      closeEditForm();
      fetchListings();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const updateListing = async (id: string, update: Partial<Listing>) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...update }),
      });
      fetchListings();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchListings();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-600",
    pending: "bg-amber-500/10 text-amber-600",
    sold: "bg-blue-500/10 text-blue-600",
    removed: "bg-red-500/10 text-red-600",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listings Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all {listings.length} vehicle listings on the platform
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {editingListing && editForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEditForm(); }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Pencil size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Edit Listing</h2>
                  <p className="text-xs text-muted-foreground">
                    {editingListing.title.substring(0, 50)}{editingListing.title.length > 50 ? "..." : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditForm}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              {/* Price, Condition, Status row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (৳)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="reconditioned">Reconditioned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>
              </div>

              {/* Make, Model, Year */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Make</label>
                  <input
                    type="text"
                    value={editForm.make}
                    onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Corolla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Mileage, Fuel Type, Transmission */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={editForm.mileage}
                    onChange={(e) => setEditForm({ ...editForm, mileage: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fuel Type</label>
                  <select
                    value={editForm.fuelType}
                    onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                    <option value="octane">Octane</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transmission</label>
                  <select
                    value={editForm.transmission}
                    onChange={(e) => setEditForm({ ...editForm, transmission: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="semi-automatic">Semi-Automatic</option>
                  </select>
                </div>
              </div>

              {/* Engine Size, Color, Location */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Engine Size (cc)</label>
                  <input
                    type="number"
                    value={editForm.engineSize}
                    onChange={(e) => setEditForm({ ...editForm, engineSize: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. White"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Dhaka"
                  />
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                <button
                  onClick={() => setEditForm({ ...editForm, featured: !editForm.featured })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    editForm.featured ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      editForm.featured ? "translate-x-6" : ""
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium">Featured Listing</p>
                  <p className="text-xs text-muted-foreground">
                    Featured listings appear at the top of search results
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeEditForm}
                className="px-5 py-2.5 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={actionLoading === editingListing._id}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {actionLoading === editingListing._id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-muted-foreground">
                <th className="px-6 py-4 font-medium">Vehicle</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Featured</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((listing) => (
                <tr key={listing._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold max-w-[200px] truncate" title={listing.title}>
                      {listing.title}
                    </p>
                    <p className="text-xs text-primary font-bold mt-1">
                      ৳ {listing.price.toLocaleString()}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {listing.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{listing.sellerId?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {listing.sellerId?.role || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      disabled={actionLoading === listing._id}
                      value={listing.status}
                      onChange={(e) => updateListing(listing._id, { status: e.target.value })}
                      className={`text-xs font-medium px-2 py-1 rounded-md outline-none cursor-pointer ${
                        statusColor[listing.status] || "bg-gray-500/10 text-gray-600"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="sold">Sold</option>
                      <option value="removed">Removed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      disabled={actionLoading === listing._id}
                      onClick={() => updateListing(listing._id, { featured: !listing.featured })}
                      className={`p-2 rounded-full transition-colors ${
                        listing.featured
                          ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                      title={listing.featured ? "Remove Featured" : "Mark Featured"}
                    >
                      <Star size={18} className={listing.featured ? "fill-amber-500" : ""} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Eye size={14} /> {listing.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditForm(listing)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Listing"
                      >
                        <Pencil size={18} />
                      </button>
                      {/* View on site */}
                      <Link
                        href={`/cars/${listing.slug}`}
                        target="_blank"
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View on site"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      {/* Delete */}
                      <button
                        disabled={actionLoading === listing._id}
                        onClick={() => deleteListing(listing._id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Listing"
                      >
                        {actionLoading === listing._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
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
