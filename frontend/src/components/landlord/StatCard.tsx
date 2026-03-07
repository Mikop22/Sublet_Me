"use client";
import { motion } from "framer-motion";

export function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-5 flex items-center gap-4 ${
        highlight
          ? "bg-accent/5 border-accent/15"
          : "bg-surface border-warm-gray/10"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          highlight ? "bg-accent/10" : "bg-warm-gray/8"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
