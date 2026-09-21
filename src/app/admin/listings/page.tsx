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
  ShieldCheck,
  FileCheck2,
  FileText,
  CheckCircle2,
  XCircle,
  FileSearch,
  Lock,
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
  paperVerified?: boolean;
  paperVerifiedAt?: string;
  paperVerificationNote?: string;
  documents?: string[];
  images: string[];
  features: string[];
  createdAt: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
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
  paperVerified: boolean;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Paper Inspection Modal State
  const [inspectingListing, setInspectingListing] = useState<Listing | null>(null);
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/admin/listings?t=" + Date.now(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("fetchListings error:", error);
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
      paperVerified: !!listing.paperVerified,
    });
  };

  const closeEditForm = () => {
    setEditingListing(null);
    setEditForm(null);
  };

  const openInspectPapers = (listing: Listing) => {
    setInspectingListing(listing);
    setActiveDocIndex(0);
  };

  const closeInspectPapers = () => {
    setInspectingListing(null);
    setActiveDocIndex(0);
  };

  const togglePaperVerification = async (listing: Listing, verified: boolean) => {
    setActionLoading(listing._id);
    const nowStr = new Date().toISOString();

    // Optimistically update React state immediately
    setListings((prev) =>
      prev.map((l) =>
        l._id === listing._id
          ? {
              ...l,
              paperVerified: verified,
              paperVerifiedAt: verified ? nowStr : undefined,
            }
          : l
      )
    );

    if (inspectingListing && inspectingListing._id === listing._id) {
      setInspectingListing({
        ...inspectingListing,
        paperVerified: verified,
        paperVerifiedAt: verified ? nowStr : undefined,
      });
    }

    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listing._id,
          paperVerified: verified,
          paperVerifiedAt: verified ? nowStr : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update verification status");
      }

      showToast(
        verified
          ? `✓ "${listing.title}" successfully approved and marked as Paper Verified!`
          : `Paper verification revoked for "${listing.title}".`
      );

      // Refresh in background to sync
      fetchListings();
    } catch (error: any) {
      console.error("togglePaperVerification error:", error);
      showToast("❌ Error: " + (error.message || "Failed to update"));
      // Revert on error
      fetchListings();
    } finally {
      setActionLoading(null);
    }
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

              {/* Featured & Paper Verified Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, featured: !editForm.featured })}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
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
                      Appears at top of search results
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, paperVerified: !editForm.paperVerified })}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      editForm.paperVerified ? "bg-emerald-500" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        editForm.paperVerified ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={16} /> Paper Verified Badge
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shows verified trust badge to public buyers
                    </p>
                  </div>
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

      {/* Inspect Car Papers Modal */}
      {inspectingListing && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeInspectPapers(); }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-card border-b border-border p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSearch size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Inspect Car Papers
                    {inspectingListing.paperVerified ? (
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Paper Verified
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Verification Pending
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {inspectingListing.title} • Seller: {inspectingListing.sellerId?.name || "Unknown"} ({inspectingListing.sellerId?.email})
                  </p>
                </div>
              </div>
              <button
                onClick={closeInspectPapers}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Privacy Notice Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
                <Lock size={16} className="text-blue-500 flex-shrink-0" />
                <span>
                  <strong>Admin Confidential:</strong> These papers are private. Regular visitors and buyers on CarHat.bd cannot see these files.
                </span>
              </div>

              {/* Status Banner inside Modal */}
              {inspectingListing.paperVerified && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Paper Verified Badge is Live!</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        This vehicle displays the official verified shield badge across CarHat.bd search, homepage, and details page.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading === inspectingListing._id}
                    onClick={() => togglePaperVerification(inspectingListing, false)}
                    className="text-xs text-red-500 hover:underline font-semibold flex-shrink-0"
                  >
                    Revoke
                  </button>
                </div>
              )}

              {/* Documents List / Viewer */}
              {!inspectingListing.documents || inspectingListing.documents.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                  <FileText size={40} className="mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="font-semibold text-foreground">No Papers Uploaded</h3>
                  <p className="text-sm mt-1">The seller did not attach car documents for this listing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Doc selection tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {inspectingListing.documents.map((docUrl, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setActiveDocIndex(idx)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                          activeDocIndex === idx
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <FileText size={14} />
                        <span>Document #{idx + 1}</span>
                      </button>
                    ))}
                  </div>

                  {/* Document preview container */}
                  {inspectingListing.documents[activeDocIndex] && (
                    <div className="border border-border rounded-2xl bg-muted/20 overflow-hidden flex flex-col items-center justify-center p-4 min-h-[350px]">
                      {inspectingListing.documents[activeDocIndex].includes("data:application/pdf") ||
                      inspectingListing.documents[activeDocIndex].toLowerCase().endsWith(".pdf") ? (
                        <div className="text-center p-8 space-y-4">
                          <FileText size={56} className="text-primary mx-auto" />
                          <div>
                            <p className="font-semibold text-base">PDF Document #{activeDocIndex + 1}</p>
                            <p className="text-xs text-muted-foreground">Click below to open/download PDF in a new tab</p>
                          </div>
                          <a
                            href={inspectingListing.documents[activeDocIndex]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                          >
                            <ExternalLink size={16} /> Open PDF Paper
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-3 w-full flex flex-col items-center">
                          <div className="max-h-[480px] overflow-auto rounded-xl border border-border bg-black/50 p-2 w-full flex items-center justify-center">
                            <img
                              src={inspectingListing.documents[activeDocIndex]}
                              alt={`Car Document ${activeDocIndex + 1}`}
                              className="max-h-[450px] max-w-full object-contain rounded-lg"
                            />
                          </div>
                          <a
                            href={inspectingListing.documents[activeDocIndex]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <ExternalLink size={12} /> View Full Resolution Image in New Tab
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Approval Actions */}
            <div className="bg-card border-t border-border p-5 flex items-center justify-between rounded-b-2xl">
              <button
                type="button"
                onClick={closeInspectPapers}
                className="px-5 py-2.5 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors text-sm"
              >
                Close
              </button>

              <div className="flex gap-3">
                {inspectingListing.paperVerified ? (
                  <button
                    type="button"
                    disabled={actionLoading === inspectingListing._id}
                    onClick={() => togglePaperVerification(inspectingListing, false)}
                    className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === inspectingListing._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Revoke Verification
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading === inspectingListing._id}
                    onClick={() => togglePaperVerification(inspectingListing, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === inspectingListing._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={18} />
                    )}
                    Approve &amp; Mark Paper Verified
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-white/20 shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3 animate-in slide-in-from-bottom-5 text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors ml-2"
          >
            <X size={14} />
          </button>
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
                <th className="px-6 py-4 font-medium">Paper Status</th>
                <th className="px-6 py-4 font-medium">Featured</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((listing) => {
                const docCount = listing.documents?.length || 0;
                return (
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

                    {/* Paper Verification Status with Clear Action Buttons */}
                    <td className="px-6 py-4">
                      {listing.paperVerified ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            <ShieldCheck size={14} />
                            <span>Paper Verified</span>
                          </span>
                          {docCount > 0 && (
                            <button
                              type="button"
                              onClick={() => openInspectPapers(listing)}
                              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                              title="View uploaded car documents"
                            >
                              <FileSearch size={12} />
                              <span>View ({docCount})</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actionLoading === listing._id}
                            onClick={() => togglePaperVerification(listing, false)}
                            className="text-[11px] text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Revoke paper verification"
                          >
                            Revoke
                          </button>
                        </div>
                      ) : docCount > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            disabled={actionLoading === listing._id}
                            onClick={() => togglePaperVerification(listing, true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                            title="Click to instantly approve car papers and grant Paper Verified badge"
                          >
                            {actionLoading === listing._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                            <span>✓ Approve Papers</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openInspectPapers(listing)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Click to preview uploaded car papers"
                          >
                            <FileSearch size={13} />
                            <span>{docCount} Doc{docCount > 1 ? "s" : ""}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                          No papers
                        </span>
                      )}
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
                        {/* Inspect Papers */}
                        {docCount > 0 && (
                          <button
                            onClick={() => openInspectPapers(listing)}
                            className="p-2 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Inspect Car Papers"
                          >
                            <FileSearch size={18} />
                          </button>
                        )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
