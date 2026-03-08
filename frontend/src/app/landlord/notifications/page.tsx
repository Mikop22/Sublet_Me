"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Users, MessageSquare, Video, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

type AuthProfile = {
  name: string;
  picture?: string;
};

type Notification = {
  id: number;
  type: "match" | "message" | "tour" | "system";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  listingId?: number;
  studentId?: number;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "match",
    title: "New match for Sunny Studio",
    description: "Aisha Rahman matched with your listing",
    timestamp: "2 hours ago",
    read: false,
    listingId: 1,
    studentId: 101,
  },
  {
    id: 2,
    type: "message",
    title: "New message from Chris",
    description: "Is the unit still available?",
    timestamp: "5 hours ago",
    read: false,
    listingId: 1,
    studentId: 102,
  },
  {
    id: 3,
    type: "tour",
    title: "Tour scheduled",
    description: "Virtual tour with Sophia tomorrow at 2 PM",
    timestamp: "1 day ago",
    read: true,
    listingId: 2,
    studentId: 201,
  },
  {
    id: 4,
    type: "match",
    title: "New match for Modern 1BR",
    description: "Maya Singh matched with your listing",
    timestamp: "1 day ago",
    read: true,
    listingId: 2,
    studentId: 201,
  },
  {
    id: 5,
    type: "message",
    title: "New message from David",
    description: "Can we schedule a viewing?",
    timestamp: "2 days ago",
    read: true,
    listingId: 2,
    studentId: 202,
  },
  {
    id: 6,
    type: "tour",
    title: "Tour completed",
    description: "Virtual tour with Emma was completed",
    timestamp: "3 days ago",
    read: true,
    listingId: 3,
    studentId: 301,
  },
];

const NOTIFICATION_ICONS = {
  match: Users,
  message: MessageSquare,
  tour: Video,
  system: CheckCircle,
};

const NOTIFICATION_COLORS = {
  match: "bg-accent/10 text-accent",
  message: "bg-sage/10 text-sage",
  tour: "bg-orange-400/10 text-orange-400",
  system: "bg-warm-gray/10 text-muted",
};

export default function NotificationsPage() {
  const [authProfile, setAuthProfile] = useState<AuthProfile>({
    name: "Landlord",
  });
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch("/auth/profile");
        if (!response.ok) return;

        const profile = (await response.json()) as Record<string, unknown>;
        const email = typeof profile.email === "string" ? profile.email : "";
        const defaultName = email.includes("@") ? email.split("@")[0] : "Landlord";
        const name =
          typeof profile.name === "string"
            ? profile.name
            : typeof profile.nickname === "string"
              ? profile.nickname
              : defaultName;
        const picture =
          typeof profile.picture === "string" ? profile.picture : undefined;

        setAuthProfile({ name, picture });
      } catch {
        // No-op: keep fallback identity if profile endpoint is unavailable.
      }
    };

    void loadUserProfile();
  }, []);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-semibold text-sm cursor-pointer ring-2 ring-background shadow-sm">
            {authProfile.picture ? (
              <img
                src={authProfile.picture}
                alt={authProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              authProfile.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </nav>

      {/* Page header */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/landlord/dashboard"
              className="flex items-center gap-1.5 text-muted text-sm hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <span className="text-warm-gray/30">/</span>
            <h1
              className="text-foreground text-xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Notifications
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-accent hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-2 pb-20">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-warm-gray/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted/40" />
              </div>
              <p className="text-muted text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification, i) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              const colorClass = NOTIFICATION_COLORS[notification.type];

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.listingId) {
                      window.location.href = `/landlord/dashboard/${notification.listingId}`;
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    notification.read
                      ? "bg-surface border-warm-gray/10 hover:border-warm-gray/20"
                      : "bg-accent/5 border-accent/20 hover:border-accent/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              notification.read ? "text-foreground/70" : "text-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {notification.description}
                          </p>
                          <p className="text-[10px] text-muted/60 mt-1.5">
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
