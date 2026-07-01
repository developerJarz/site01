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
      router.push("/login");
      return;
    }

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
      } else if (data.error) {
        alert(data.error);
        setStartingChat(false);
      }
    } catch (err) {
      console.error("Failed to start chat", err);
      alert("Something went wrong");
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
        <div className="w-full h-12 bg-muted animate-pulse rounded-xl"></div>
        <div className="w-full h-12 bg-muted animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Phone Button */}
      {sellerData?.showPhone && (
        <button
          onClick={() => setPhoneVisible(true)}
          className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${
            phoneVisible
              ? "bg-muted text-foreground cursor-default border border-border"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
          }`}
        >
          <Phone size={20} />
          {phoneVisible ? sellerData.phone : "Show Phone Number"}
        </button>
      )}

      {/* WhatsApp Button */}
      {sellerData?.showWhatsApp && (
        <button
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#20b858] transition-colors shadow-lg shadow-green-500/20"
        >
          <MessageCircle size={20} /> WhatsApp Seller
        </button>
      )}

      {/* Live Chat Button */}
      {(!session || (session.user as any).id !== sellerId) && (
        <button
          onClick={handleStartChat}
          disabled={startingChat}
          className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          {startingChat ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <MessageSquare size={20} />
          )}
          {startingChat ? "Opening Chat..." : "Chat with Seller"}
        </button>
      )}
    </div>
  );
}
