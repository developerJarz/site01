"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { useState, useEffect } from "react";
import { Phone, MessageSquare, Loader2, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { dialableNumber, formatPhoneNumber } from "@/lib/contact-details";

interface SellerContactCardProps {
  listingId: string;
  sellerId: string;
  carTitle: string;
}

export function SellerContactCard({ listingId, sellerId, carTitle }: SellerContactCardProps) {
  const { data: session } = useSession();
  const router = useProgressRouter();
  
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);
  
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    fetch(`/api/seller-contact?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.seller) {
          setSellerData(data.seller);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load seller contact", err);
        setLoading(false);
      });
  }, [listingId]);

  const handleStartChat = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setChatError("");
    setStartingChat(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, listingId }),
      });
      
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/dashboard/messages?conversation=${data.conversationId}`);
      } else {
        setChatError(data.error || "Couldn't open the chat. Try again.");
        setStartingChat(false);
      }
    } catch (err) {
      console.error("Failed to start chat", err);
      setChatError("Couldn't reach CarHat. Check your connection and try again.");
      setStartingChat(false);
    }
  };

  const handleWhatsApp = () => {
    if (sellerData?.whatsappNumber) {
      const text = encodeURIComponent(`Hi, I'm interested in your ${carTitle} listed on CarHat.bd`);
      window.open(`https://wa.me/${dialableNumber(sellerData.whatsappNumber)}?text=${text}`, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Phone Button */}
      {sellerData?.showPhone &&
        (phoneVisible ? (
          <a
            href={`tel:+${dialableNumber(sellerData.phone)}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-electric bg-white font-semibold text-electric tabular"
          >
            <Phone size={19} aria-hidden /> Call {formatPhoneNumber(sellerData.phone)}
          </a>
        ) : (
          <button
            onClick={() => setPhoneVisible(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-electric font-semibold text-white shadow-glow transition-colors hover:bg-electric-deep"
          >
            <Phone size={19} aria-hidden /> Show phone number
          </button>
        ))}

      {/* WhatsApp Button */}
      {sellerData?.showWhatsApp && (
        <button
          onClick={handleWhatsApp}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#128c4a] font-semibold text-white transition-colors hover:bg-[#0e7a40]"
        >
          <MessageCircle size={19} aria-hidden /> WhatsApp the seller
        </button>
      )}

      {/* Live Chat Button */}
      {(!session || (session.user as any).id !== sellerId) && (
        <button
          onClick={handleStartChat}
          disabled={startingChat}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-night font-semibold text-white transition-colors hover:bg-electric disabled:opacity-60"
        >
          {startingChat ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <MessageSquare size={20} />
          )}
          {startingChat ? "Opening chat…" : session ? "Message the seller" : "Sign in to message the seller"}
        </button>
      )}
      {chatError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {chatError}
        </p>
      )}
    </div>
  );
}
