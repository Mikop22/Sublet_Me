"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Listing, ListingStatus } from "@/lib/landlord-mock";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-sage/10 text-sage border-sage/20",
  paused: "bg-warm-gray/10 text-muted border-warm-gray/20",
  filled: "bg-accent/10 text-accent border-accent/20",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  paused: "Paused",
  filled: "Filled",
};

export function LandlordListingCard({ listing }: { listing: Listing }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-surface border border-warm-gray/10"
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        <motion.img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm cursor-pointer hover:bg-white transition-colors"
          >
            <svg
              className="w-4 h-4 text-foreground/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-warm-gray/10 py-1 w-36 z-20"
              >
                {["Edit", "Pause", "Delete"].map((action) => (
                  <button
                    key={action}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      action === "Delete"
                        ? "text-red-500 hover:bg-red-50"
                        : "text-foreground hover:bg-warm-gray/8"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-5">
        <h3 className="font-semibold text-foreground text-[15px] leading-tight group-hover:text-accent transition-colors">
          {listing.title}
        </h3>
        <p className="text-muted text-xs mt-1">{listing.address}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted">
          <span>{listing.matches} matches</span>
          <span className="w-1 h-1 rounded-full bg-warm-gray/30" />
          <span>{listing.views} views</span>
          <span className="w-1 h-1 rounded-full bg-warm-gray/30" />
          <span>{listing.inquiries} inquiries</span>
        </div>

        <p className="text-[11px] text-muted/70 mt-1">{listing.dates}</p>

        {/* CTA */}
        <Link
          href={`/landlord/dashboard/${listing.id}`}
          className="mt-4 block w-full py-2.5 rounded-xl text-xs font-semibold text-center text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors border border-warm-gray/10"
        >
          View matches
        </Link>
      </div>
    </motion.div>
  );
}
