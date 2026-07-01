"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Save,
  Loader2,
  Camera,
  CheckCircle2,
  XCircle,
  Key,
  Store,
  BadgeCheck,
  FileText,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface Profile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  bio: string;
  address: string;
  city: string;
  dealershipName: string;
  dealershipLicense: string;
  isVerified: boolean;
  whatsappNumber?: string;
  allowPhoneDisplay?: boolean;
  allowWhatsApp?: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "+880",
    bio: "",
    address: "",
    city: "",
    dealershipName: "",
    dealershipLicense: "",
    whatsappNumber: "+880",
    allowPhoneDisplay: true,
    allowWhatsApp: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setProfile(data.user);
            setForm({
              name: data.user.name || "",
              phone: data.user.phone || "+880",
              bio: data.user.bio || "",
              address: data.user.address || "",
              city: data.user.city || "",
              dealershipName: data.user.dealershipName || "",
              dealershipLicense: data.user.dealershipLicense || "",
              whatsappNumber: data.user.whatsappNumber || "+880",
              allowPhoneDisplay: data.user.allowPhoneDisplay ?? true,
              allowWhatsApp: data.user.allowWhatsApp ?? true,
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.patch("/api/user/profile", form);
      setProfile(res.data.user);
      setEditing(false);
      setSuccess("Profile updated successfully");
      update();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post("/api/user/password", { currentPassword, newPassword });
      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const isDealer = profile.role === "dealer";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Profile</span>
      </nav>

      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary/20">
              {profile.name?.[0] || "U"}
            </div>
            {editing && (
              <button className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow-lg hover:bg-primary/90 transition-colors">
                <Camera size={14} />
              </button>
            )}
          </div>
          <div className="flex-grow">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="text-2xl font-bold bg-background border border-border rounded-lg px-3 py-1 w-full max-w-md focus:ring-2 focus:ring-primary outline-none"
              />
            ) : (
              <h1 className="text-2xl font-bold">{profile.name}</h1>
            )}
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail size={14} />
              {profile.email}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="capitalize bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <UserIcon size={12} />
                {profile.role}
              </span>
              {profile.isVerified && (
                <span className="text-green-600 bg-green-500/10 px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <BadgeCheck size={12} />
                  Verified
                </span>
              )}
              {isDealer && profile.dealershipName && (
                <span className="text-purple-600 bg-purple-500/10 px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Store size={12} />
                  {profile.dealershipName}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: profile.name || "",
                      phone: profile.phone || "",
                      bio: profile.bio || "",
                      address: profile.address || "",
                      city: profile.city || "",
                      dealershipName: profile.dealershipName || "",
                      dealershipLicense: profile.dealershipLicense || "",
                      whatsappNumber: profile.whatsappNumber || "",
                      allowPhoneDisplay: profile.allowPhoneDisplay || false,
                      allowWhatsApp: profile.allowWhatsApp || false,
                    });
                  }}
                  className="bg-muted text-muted-foreground px-5 py-2 rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl mb-6 border border-destructive/20 flex items-center gap-2">
          <XCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-600 text-sm p-4 rounded-xl mb-6 border border-green-500/20 flex items-center gap-2">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-3">
              <UserIcon size={18} className="text-primary" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                {editing ? (
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm font-medium">
                      +880
                    </span>
                    <input
                      type="tel"
                      value={form.phone.replace(/^\+880\s*/, '')}
                      onChange={(e) => setForm({ ...form, phone: "+880" + e.target.value.replace(/^\+880\s*/, '') })}
                      placeholder="1X XX-XXXXXX"
                      className="w-full px-3 py-2 bg-background border border-border rounded-r-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                ) : (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    {profile.phone || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">City</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Dhaka"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                ) : (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground" />
                    {profile.city || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
                {editing ? (
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. 123 Gulshan Avenue"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                ) : (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground" />
                    {profile.address || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Bio</label>
                {editing ? (
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                ) : (
                  <p className="text-sm">
                    {profile.bio || <span className="text-muted-foreground italic">No bio added yet</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dealer Information */}
          {isDealer && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Store size={18} className="text-purple-500" />
                Dealership Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Dealership Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.dealershipName}
                      onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
                      placeholder="e.g. Dhaka Car Hub"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      {profile.dealershipName || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">License Number</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.dealershipLicense}
                      onChange={(e) => setForm({ ...form, dealershipLicense: e.target.value })}
                      placeholder="e.g. DLS-2024-0042"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      {profile.dealershipLicense || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact & Visibility Settings */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Phone size={18} className="text-green-500" />
              Contact & Visibility Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp Number</label>
                {editing ? (
                  <div className="flex w-full md:w-1/2">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm font-medium">
                      +880
                    </span>
                    <input
                      type="tel"
                      value={form.whatsappNumber.replace(/^\+880\s*/, '')}
                      onChange={(e) => setForm({ ...form, whatsappNumber: "+880" + e.target.value.replace(/^\+880\s*/, '') })}
                      placeholder="1X XX-XXXXXX"
                      className="w-full px-3 py-2 bg-background border border-border rounded-r-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                ) : (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    {profile.whatsappNumber || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border mt-4">
                <div>
                  <h3 className="font-medium text-sm">Show Phone Number</h3>
                  <p className="text-xs text-muted-foreground">Allow buyers to see your phone number on listings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    disabled={!editing}
                    checked={editing ? form.allowPhoneDisplay : (profile.allowPhoneDisplay || false)}
                    onChange={(e) => setForm({ ...form, allowPhoneDisplay: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary opacity-80 peer-disabled:opacity-50"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <h3 className="font-medium text-sm">Enable WhatsApp Contact</h3>
                  <p className="text-xs text-muted-foreground">Show WhatsApp button on your listings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    disabled={!editing}
                    checked={editing ? form.allowWhatsApp : (profile.allowWhatsApp || false)}
                    onChange={(e) => setForm({ ...form, allowWhatsApp: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary opacity-80 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Key size={18} className="text-primary" />
              Change Password
            </h2>
            {passwordError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20 flex items-center gap-2">
                <XCircle size={14} />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg mb-4 border border-green-500/20 flex items-center gap-2">
                <CheckCircle2 size={14} />
                {passwordSuccess}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2 border-b border-border pb-3 uppercase tracking-wider text-muted-foreground">
              <Shield size={16} className="text-primary" />
              Account Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification</span>
                <span className={`font-medium ${profile.isVerified ? "text-green-600" : "text-amber-600"}`}>
                  {profile.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2 border-b border-border pb-3 uppercase tracking-wider text-muted-foreground">
              Quick Links
            </h2>
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <UserIcon size={16} className="text-primary" />
                My Dashboard
              </Link>
              <Link
                href="/sell"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <Building2 size={16} className="text-primary" />
                Post an Ad
              </Link>
              <Link
                href="/cars"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <MapPin size={16} className="text-primary" />
                Browse Cars
              </Link>
            </div>
          </div>

          {/* Role Badge */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {isDealer ? (
                <Store size={20} className="text-purple-500" />
              ) : (
                <UserIcon size={20} className="text-primary" />
              )}
              <h3 className="font-bold capitalize">{profile.role} Account</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isDealer
                ? "You have access to dealer features including bulk uploads and analytics."
                : profile.role === "seller"
                ? "You can list and manage your car ads with ease."
                : profile.role === "admin"
                ? "You have full access to the admin panel."
                : "Browse and discover the best cars in Bangladesh."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
