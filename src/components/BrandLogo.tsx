"use client";

import { useState } from "react";

interface BrandLogoProps {
  src: string;
  alt: string;
  fallbackInitial: string;
  brandName: string;
}

// Brand-specific colors matching their real brand identity
const BRAND_STYLES: Record<string, { bg: string; text: string }> = {
  "Toyota": { bg: "bg-gradient-to-br from-red-50 to-red-100", text: "text-red-600" },
  "Honda": { bg: "bg-gradient-to-br from-red-50 to-red-100", text: "text-red-700" },
  "BMW": { bg: "bg-gradient-to-br from-blue-50 to-blue-100", text: "text-blue-600" },
  "Mercedes-Benz": { bg: "bg-gradient-to-br from-gray-50 to-gray-100", text: "text-gray-700" },
  "Nissan": { bg: "bg-gradient-to-br from-gray-50 to-slate-100", text: "text-gray-700" },
  "Hyundai": { bg: "bg-gradient-to-br from-blue-50 to-indigo-100", text: "text-blue-700" },
  "Audi": { bg: "bg-gradient-to-br from-gray-50 to-gray-100", text: "text-gray-800" },
  "Lexus": { bg: "bg-gradient-to-br from-gray-50 to-gray-100", text: "text-gray-800" },
  "Kia": { bg: "bg-gradient-to-br from-red-50 to-red-100", text: "text-red-600" },
  "Mazda": { bg: "bg-gradient-to-br from-gray-50 to-gray-100", text: "text-gray-700" },
  "Volkswagen": { bg: "bg-gradient-to-br from-blue-50 to-blue-100", text: "text-blue-700" },
  "Mitsubishi": { bg: "bg-gradient-to-br from-red-50 to-red-100", text: "text-red-600" },
};

export function BrandLogo({ src, alt, fallbackInitial, brandName }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const style = BRAND_STYLES[brandName] || { bg: "bg-gradient-to-br from-primary/10 to-purple-100", text: "text-primary" };

  if (hasError) {
    return (
      <div className={`w-full h-full rounded-xl ${style.bg} flex items-center justify-center`}>
        <span className={`font-extrabold text-lg ${style.text} tracking-tight`}>
          {brandName.length > 5 ? fallbackInitial : brandName}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain drop-shadow-sm"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
