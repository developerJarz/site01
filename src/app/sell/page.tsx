"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera,
  CheckCircle,
  Upload,
  X,
  FileText,
  Loader2,
  ImageIcon,
  ShieldCheck,
  Lock,
  BadgeCheck,
  FileCheck2,
} from "lucide-react";
import axios from "axios";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

// Client-side image compression to ensure fast, reliable uploads on live sites
async function compressImageFile(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newFile = new File([blob], cleanName, { type: "image/webp" });
            resolve(newFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function SellCarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatusText, setUploadStatusText] = useState("");

  // Image uploads
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Document uploads
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [docNames, setDocNames] = useState<string[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    condition: "used",
    description: "",
    fuelType: "petrol",
    transmission: "automatic",
    engineSize: "",
    color: "",
    location: "Dhaka",
    features: [] as string[],
  });

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Sign in to Post an Ad</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          You need an account to sell your car on CarHat.bd. It takes less than a
          minute!
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-primary text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  // ── Image handling ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files].slice(0, 10); // max 10 images
    setImageFiles(newFiles);

    // Generate previews
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (idx: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== idx);
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // ── Document handling ──
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...docFiles, ...files].slice(0, 5);
    setDocFiles(newFiles);
    setDocNames(newFiles.map((f) => f.name));
  };

  const removeDoc = (idx: number) => {
    setDocFiles(docFiles.filter((_, i) => i !== idx));
    setDocNames(docNames.filter((_, i) => i !== idx));
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Compress and Upload images via the upload API
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        setUploadStatusText("Optimizing car photos...");
        
        const compressedFiles: File[] = [];
        for (const file of imageFiles) {
          const compressed = await compressImageFile(file, 1600, 0.82);
          compressedFiles.push(compressed);
        }

        setUploadStatusText("Uploading photos...");
        try {
          const fd = new FormData();
          compressedFiles.forEach((f) => fd.append("files", f));
          const uploadRes = await axios.post("/api/upload", fd);
          if (uploadRes.data?.urls && uploadRes.data.urls.length > 0) {
            imageUrls = uploadRes.data.urls;
          } else {
            throw new Error("No image URLs returned");
          }
        } catch (uploadErr) {
          console.warn("Server upload endpoint failed, switching to in-browser encoding:", uploadErr);
          imageUrls = await Promise.all(compressedFiles.map((f) => fileToDataUrl(f)));
        }
        setUploadingImages(false);
      }

      // 2. Upload documents (Registration / Tax / Fitness)
      let docUrls: string[] = [];
      if (docFiles.length > 0) {
        setUploadingDocs(true);
        setUploadStatusText("Uploading private car papers...");
        
        const compressedDocFiles: File[] = [];
        for (const file of docFiles) {
          if (file.type.startsWith("image/")) {
            const compressed = await compressImageFile(file, 1600, 0.85);
            compressedDocFiles.push(compressed);
          } else {
            compressedDocFiles.push(file);
          }
        }

        try {
          const fd = new FormData();
          compressedDocFiles.forEach((f) => fd.append("files", f));
          const uploadRes = await axios.post("/api/upload", fd);
          if (uploadRes.data?.urls && uploadRes.data.urls.length > 0) {
            docUrls = uploadRes.data.urls;
          } else {
            throw new Error("No doc URLs returned");
          }
        } catch (docUploadErr) {
          console.warn("Doc upload endpoint failed, switching to in-browser encoding:", docUploadErr);
          docUrls = await Promise.all(compressedDocFiles.map((f) => fileToDataUrl(f)));
        }
        setUploadingDocs(false);
      }

      // 3. Create listing
      setUploadStatusText("Publishing listing...");
      const response = await axios.post("/api/listings", {
        ...formData,
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        year: Number(formData.year),
        engineSize: Number(formData.engineSize || 1500),
        images: imageUrls,
        documents: docUrls,
      });

      if (response.data.success) {
        setStep(4); // success step
      }
    } catch (err: any) {
      console.error("Sell submission error:", err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to post ad. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setUploadingImages(false);
      setUploadingDocs(false);
      setUploadStatusText("");
    }
  };

  const stepLabels = ["Vehicle Info", "Pricing & Details", "Photos & Docs", "Done"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sell Your Car</h1>
        <p className="text-muted-foreground">
          Post your ad in minutes and reach thousands of buyers.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center mb-8">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                  step > i + 1
                    ? "bg-green-500 text-white"
                    : step === i + 1
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
              </div>
              <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step > i + 1 ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 border border-destructive/20">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        {/* ══════ STEP 1: Vehicle Info ══════ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Make / Brand <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                >
                  <option value="">Select Make</option>
                  {["Toyota","Honda","Nissan","Hyundai","BMW","Mercedes-Benz","Audi","Kia","Mazda","Lexus","Volkswagen","Mitsubishi","Suzuki","Subaru"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corolla, Civic"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Year <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2022"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Condition
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                >
                  <option value="used">Used</option>
                  <option value="reconditioned">Reconditioned</option>
                  <option value="new">Brand New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fuel Type
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.fuelType}
                  onChange={(e) =>
                    setFormData({ ...formData, fuelType: e.target.value })
                  }
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
                <label className="block text-sm font-medium mb-1">
                  Transmission
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.transmission}
                  onChange={(e) =>
                    setFormData({ ...formData, transmission: e.target.value })
                  }
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                disabled={!formData.make || !formData.model || !formData.year}
                className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-opacity shadow-lg shadow-primary/20"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* ══════ STEP 2: Pricing ══════ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
              Pricing &amp; Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expected Price (৳) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mileage (km) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.mileage}
                  onChange={(e) =>
                    setFormData({ ...formData, mileage: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Engine Size (cc)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.engineSize}
                  onChange={(e) =>
                    setFormData({ ...formData, engineSize: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="text"
                  placeholder="e.g. Pearl White"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Gulshan, Dhaka"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your car's features, condition, history, etc."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="bg-muted text-muted-foreground px-8 py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.price || !formData.mileage || !formData.description}
                className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-opacity shadow-lg shadow-primary/20"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* ══════ STEP 3: Photos & Documents ══════ */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Car Photos */}
            <div>
              <h2 className="text-xl font-semibold mb-1">
                Upload Car Photos <span className="text-destructive">*</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload up to 10 photos. All images are automatically resized and optimized to WebP format.
              </p>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-[4/3]">
                      <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-center text-[10px] py-0.5 font-bold">
                          COVER PHOTO
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer"
              >
                <ImageIcon size={40} className="mb-3 text-primary/50" />
                <p className="font-medium">Click to select car photos</p>
                <p className="text-xs mt-1">
                  PNG, JPG, WEBP — auto-converted to 1200×800 WebP
                </p>
                <p className="text-xs text-primary mt-2">
                  {imageFiles.length}/10 photos selected
                </p>
              </button>
            </div>

            {/* Car Documents */}
            <div className="bg-muted/10 border border-border rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileCheck2 className="text-primary" size={22} />
                  Upload Car Papers &amp; Documents
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Optional but Highly Recommended
                  </span>
                </h2>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Upload your car&apos;s registration certificate, fitness paper, tax token, or ownership slip.
              </p>

              {/* Privacy & Trust Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                <ShieldCheck className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Lock size={12} /> 100% Confidential &amp; Admin-Only View
                  </p>
                  <p className="opacity-90">
                    Your car papers are never shown to the public. Only CarHat authorized admins can view these documents to authenticate the car.
                  </p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400 pt-0.5">
                    ✨ Once verified by admin, your listing gets an exclusive <strong>&quot;Paper Verified&quot;</strong> badge to win buyer trust and sell 3x faster!
                  </p>
                </div>
              </div>

              <input
                ref={docInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleDocSelect}
              />

              {docNames.length > 0 && (
                <div className="space-y-2 mb-4">
                  {docNames.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={20} className="text-primary flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium truncate block">{name}</span>
                          <span className="text-[11px] text-muted-foreground">Private Document #{i + 1}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                        title="Remove document"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground transition-all cursor-pointer"
              >
                <Upload size={32} className="mb-2 text-primary/60" />
                <p className="font-medium text-foreground text-sm">Click to select car papers (PDF or Image)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registration Smart Card, Tax Token, Fitness Certificate, Route Permit
                </p>
                {docFiles.length > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                    ✓ {docFiles.length} document(s) attached for verification
                  </p>
                )}
              </button>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="bg-muted text-muted-foreground px-8 py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={imageFiles.length === 0 || loading}
                className="bg-primary text-primary-foreground px-8 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {uploadStatusText ||
                      (uploadingImages
                        ? "Uploading photos..."
                        : uploadingDocs
                        ? "Uploading docs..."
                        : "Publishing...")}
                  </>
                ) : (
                  "Post Ad Now 🚀"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════ STEP 4: Success ══════ */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h2 className="text-3xl font-bold mb-2">Ad Posted Successfully!</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Your car listing for <span className="font-semibold text-foreground">{formData.year} {formData.make} {formData.model}</span> is now published!
            </p>
            {docFiles.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs px-4 py-3 rounded-xl max-w-md text-center mb-8 flex items-center gap-2">
                <BadgeCheck className="text-emerald-500 flex-shrink-0" size={20} />
                <span>Our team is reviewing your uploaded papers. Once verified, the &quot;Paper Verified&quot; badge will be applied automatically!</span>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-muted text-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/cars")}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
              >
                View All Cars
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
