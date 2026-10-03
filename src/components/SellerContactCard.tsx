"use client";

import { useState, useEffect } from "react";
import { Phone, MessageSquare, Loader2, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SellerContactCardProps {
  listingId: string;
  sellerId: string;
  carTitle: string;
}

export function SellerContactCard({ listingId, sellerId, carTitle }: SellerContactCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
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
      let phone = sellerData.whatsappNumber.replace(/[^0-9]/g, "");
      // Default prepend 880 if starts with 01
      if (phone.startsWith("01") && phone.length === 11) {
        phone = "880" + phone.substring(1);
      }
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="skeleton h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Phone Button */}
      {sellerData?.showPhone &&
        (phoneVisible ? (
          <a
            href={`tel:${sellerData.phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-card py-3 font-semibold text-primary tabular"
          >
            <Phone size={19} aria-hidden /> Call {sellerData.phone}
          </a>
        ) : (
          <button
            onClick={() => setPhoneVisible(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-[#0a4594]"
          >
            <Phone size={19} aria-hidden /> Show phone number
          </button>
        ))}

      {/* WhatsApp Button */}
      {sellerData?.showWhatsApp && (
        <button
          onClick={handleWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#075e54] py-3 font-semibold text-white transition-colors hover:bg-[#054d45]"
        >
          <MessageCircle size={19} aria-hidden /> WhatsApp the seller
        </button>
      )}

      {/* Live Chat Button */}
      {(!session || (session.user as any).id !== sellerId) && (
        <button
          onClick={handleStartChat}
          disabled={startingChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card py-3 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
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
