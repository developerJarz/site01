"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Loader2,
  ChevronLeft,
  User as UserIcon,
  Search,
  Car
} from "lucide-react";
import axios from "axios";

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get("conversation");

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile view state (show list vs show chat)
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/conversations");
      setConversations(res.data.conversations);
      setLoadingConversations(false);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status]);

  // Fetch messages for active conversation
  const fetchMessages = async (convId: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await axios.get(`/api/conversations/${convId}/messages`);
      setMessages(res.data.messages);
      
      // Update unread count locally
      setConversations(prev => prev.map(c => 
        c._id === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Setup active conversation
  useEffect(() => {
    if (activeConversationId && status === "authenticated") {
      fetchMessages(activeConversationId);
      setShowChatOnMobile(true);
    } else {
      setShowChatOnMobile(false);
      setMessages([]);
    }
  }, [activeConversationId, status]);

  // Polling for active conversation
  useEffect(() => {
    if (!activeConversationId || status !== "authenticated") return;
    
    const interval = setInterval(() => {
      fetchMessages(activeConversationId, false);
      fetchConversations(); // Also update list to get latest messages/unread counts for other convos
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeConversationId, status]);

  // Auto-scroll to bottom of messages container without scrolling the page
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || sending) return;

    const content = newMessage.trim();
    setNewMessage(""); // Optimistic clear
    setSending(true);

    try {
      await axios.post(`/api/conversations/${activeConversationId}/messages`, {
        content,
      });
      fetchMessages(activeConversationId, false);
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
      setNewMessage(content); // Restore on fail
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/dashboard/messages?conversation=${id}`);
  };

  if (status === "loading" || loadingConversations) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const activeConversation = conversations.find(c => c._id === activeConversationId);
  const userId = (session?.user as any)?.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hidden md:flex">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Messages</span>
      </nav>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-[700px] max-h-[80vh] flex">
        
        {/* Left Sidebar - Conversations List */}
        <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Messages
            </h2>
            <div className="mt-4 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                <p>No messages yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3 ${activeConversationId === conv._id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                  >
                    <div className="relative">
                      {conv.otherParty.avatar ? (
                        <img src={conv.otherParty.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                          {conv.otherParty.name[0]}
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-card">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-sm truncate pr-2">{conv.otherParty.name}</h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-primary font-medium truncate mb-1 flex items-center gap-1">
                        <Car size={10} /> {conv.listing.title}
                      </p>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {conv.lastMessage || "Started a conversation"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Active Chat */}
        <div className={`w-full md:w-2/3 flex flex-col ${!showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
          {!activeConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-primary opacity-50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your Messages</h3>
              <p className="text-muted-foreground max-w-sm">
                Select a conversation from the sidebar to view your messages or reply to inquiries.
              </p>
            </div>
          ) : !activeConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/10">
                <button 
                  onClick={() => router.push("/dashboard/messages")}
                  className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={24} />
                </button>
                
                {activeConversation.otherParty.avatar ? (
                  <img src={activeConversation.otherParty.avatar} alt="" className="w-10 h-10 rounded-full object-cover hidden sm:block" />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold hidden sm:flex">
                    {activeConversation.otherParty.name[0]}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{activeConversation.otherParty.name}</h3>
                  <Link href={`/cars/${activeConversation.listing.slug}`} className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
                    {activeConversation.listing.title} • ৳ {activeConversation.listing.price?.toLocaleString()}
                  </Link>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No messages yet. Send a message to start the conversation!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender._id === userId;
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender._id !== msg.sender._id);
                    
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                        {!isMe && (
                          <div className="w-8 flex-shrink-0 mr-2">
                            {showAvatar && (
                              msg.sender.avatar ? (
                                <img src={msg.sender.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                  {msg.sender.name[0]}
                                </div>
                              )
                            )}
                          </div>
                        )}
                        
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-muted text-foreground rounded-tl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-muted/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0 shadow-sm"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-1" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
