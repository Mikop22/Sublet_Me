"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const universities = [
    "Waterloo", "Toronto", "UBC", "McGill", "McMaster",
    "Ottawa", "Queen's", "Calgary", "Western", "Victoria",
    "Dalhousie", "Alberta", "SFU", "Carleton", "Guelph",
];

export default function ScrollTicker() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
    const x2 = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

    return (
        <div
            ref={containerRef}
            className="py-8 sm:py-16 overflow-hidden border-y border-warm-gray/30"
        >
            {/* Row 1 — moves left on scroll */}
            <motion.div className="flex items-center gap-4 sm:gap-8 mb-4 sm:mb-6 whitespace-nowrap" style={{ x: x1 }}>
                {[...universities, ...universities].map((uni, i) => (
                    <span
                        key={`r1-${i}`}
                        className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-serif text-warm-gray tracking-tight select-none"
                    >
                        {uni}
                    </span>
                ))}
            </motion.div>

            {/* Row 2 — moves right on scroll */}
            <motion.div className="flex items-center gap-4 sm:gap-8 whitespace-nowrap" style={{ x: x2 }}>
                {[...universities.slice().reverse(), ...universities.slice().reverse()].map((uni, i) => (
                    <span
                        key={`r2-${i}`}
                        className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-serif text-warm-gray/60 tracking-tight select-none"
                    >
                        {uni}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
