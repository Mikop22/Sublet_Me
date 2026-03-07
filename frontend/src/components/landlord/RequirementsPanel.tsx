"use client";

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Requirements } from "@/lib/landlord-mock";

const GENDER_LABELS: Record<string, string> = {
  "no-preference": "No preference",
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
};

const PET_LABELS: Record<string, string> = {
  "no-pets": "No pets",
  "pets-ok": "Pets OK",
};

export function RequirementsPanel({ requirements }: { requirements: Requirements }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-warm-gray/10 bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-gray/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-muted" />
          <span className="text-sm font-semibold text-foreground">
            Match requirements
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t border-warm-gray/8">
              <RequirementRow label="Budget">
                ${requirements.budgetMin} – ${requirements.budgetMax}/mo
              </RequirementRow>
              <RequirementRow label="Term">
                {requirements.termPreference}
              </RequirementRow>
              <RequirementRow label="Occupants">
                {requirements.occupants} person{requirements.occupants !== 1 ? "s" : ""}
              </RequirementRow>
              <RequirementRow label="Pets">
                {PET_LABELS[requirements.petPolicy]}
              </RequirementRow>
              <RequirementRow label="Gender">
                {GENDER_LABELS[requirements.genderPreference]}
              </RequirementRow>
              <RequirementRow label="References">
                {requirements.referencesRequired ? "Required" : "Not required"}
              </RequirementRow>
              <div>
                <p className="text-[11px] text-muted mb-2">Lifestyle tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {requirements.lifestyleTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-accent/8 text-accent border border-accent/15 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-4">
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-accent border border-accent/20 hover:bg-accent/5 transition-colors">
                Edit requirements
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequirementRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[12px] font-medium text-foreground">{children}</span>
    </div>
  );
}
