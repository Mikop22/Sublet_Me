"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(listing.status);

  const handlePause = async () => {
    setMenuOpen(false);
    setIsProcessing(true);
    
    // Update status immediately for UI feedback
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    setCurrentStatus(newStatus);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // In a real app, you would update the listing status here
    // For now, just refresh the page
    router.refresh();
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setMenuOpen(false);
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // In a real app, you would delete the listing here
    // For now, just refresh the page
    router.refresh();
    setIsProcessing(false);
  };

  const openDeleteConfirm = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className={`group relative rounded-2xl overflow-hidden bg-surface border border-warm-gray/10 ${
        currentStatus === "paused" ? "opacity-60 grayscale" : ""
      }`}
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
                <Link
                  href={`/landlord/dashboard/${listing.id}/edit`}
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer text-foreground hover:bg-warm-gray/8 block"
                >
                  Edit
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handlePause();
                  }}
                  disabled={isProcessing}
                  className="w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer text-foreground hover:bg-warm-gray/8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStatus === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    openDeleteConfirm();
                  }}
                  disabled={isProcessing}
                  className="w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-surface rounded-2xl shadow-xl border border-warm-gray/10 max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="text-foreground text-lg font-semibold mb-2"
                      style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                    >
                      Delete listing?
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      Are you sure you want to delete <span className="font-medium text-foreground">"{listing.title}"</span>? This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-8 h-8 rounded-full hover:bg-warm-gray/10 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-muted" />
                  </button>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-warm-gray/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
