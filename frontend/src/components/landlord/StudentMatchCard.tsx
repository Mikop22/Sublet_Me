"use client";

import { motion } from "framer-motion";
import { MessageSquare, Video } from "lucide-react";
import type { StudentMatch } from "@/lib/landlord-mock";

export function StudentMatchCard({
  student,
  listingRequirementTags,
  onMessage,
  onScheduleTour,
}: {
  student: StudentMatch;
  listingRequirementTags: string[];
  onMessage: () => void;
  onScheduleTour: () => void;
}) {
  const sharedTags = student.lifestyleTags.filter((t) =>
    listingRequirementTags.includes(t)
  );

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-surface border border-warm-gray/10 rounded-2xl p-5 hover:border-warm-gray/25 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-warm-gray/10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground text-sm">
                {student.name}
              </p>
              <p className="text-xs text-muted">{student.university}</p>
              <p className="text-[11px] text-muted/70">{student.term}</p>
            </div>
            {/* Match badge */}
            <div className="flex-shrink-0 flex flex-col items-center bg-accent/8 border border-accent/15 rounded-xl px-2.5 py-1.5">
              <span className="text-base font-bold text-accent leading-none">
                {student.match}%
              </span>
              <span className="text-[9px] text-accent/70 mt-0.5">match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-muted/80 mb-3 leading-relaxed">{student.bio}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {student.lifestyleTags.map((tag) => (
          <span
            key={tag}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
              sharedTags.includes(tag)
                ? "bg-accent/10 text-accent border border-accent/15"
                : "bg-warm-gray/10 text-muted/70"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onMessage}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors border border-warm-gray/10 flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
        <button
          onClick={onScheduleTour}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(232,93,74,0.25)]"
        >
          <Video className="w-3.5 h-3.5" />
          Schedule Tour
        </button>
      </div>
    </motion.div>
  );
}
