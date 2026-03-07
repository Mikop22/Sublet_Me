"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import MagneticButton from "./MagneticButton";

export default function CTASection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end end"],
    });

    const scale = useTransform(scrollYProgress, [0, 0.6], [0.8, 1]);
    const borderRadius = useTransform(scrollYProgress, [0, 0.6], [60, 0]);
    const textScale = useTransform(scrollYProgress, [0.2, 0.7], [0.9, 1]);

    return (
        <section ref={sectionRef} className="pt-12 pb-0">
            <motion.div
                className="relative overflow-hidden bg-accent text-white min-h-[70vh] flex items-center justify-center px-8 py-20 md:py-28"
                style={{ scale, borderRadius }}
            >
                {/* Decorative shapes */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-white/[0.03] rounded-full translate-x-1/3 translate-y-1/3" />

                {/* Grain */}
                <div className="absolute inset-0 opacity-[0.04]">
                    <svg width="100%" height="100%">
                        <defs>
                            <filter id="noise-cta">
                                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                            </filter>
                        </defs>
                        <rect width="100%" height="100%" filter="url(#noise-cta)" />
                    </svg>
                </div>

                <motion.div className="relative z-10 text-center max-w-3xl mx-auto" style={{ scale: textScale }}>
                    <motion.p
                        className="text-white/50 font-semibold text-sm uppercase tracking-widest mb-5"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Ready to find your next home?
                    </motion.p>

                    <motion.h2
                        className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] mb-6"
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        Your housing,<br />sorted in minutes.
                    </motion.h2>

                    <motion.p
                        className="text-white/60 text-lg font-medium max-w-lg mx-auto mb-10"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        Join thousands of Canadian co-op students who found their perfect sublet match.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                    >
                        <MagneticButton
                            className="bg-white text-accent font-semibold px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] text-lg cursor-pointer"
                            href="/create-profile/find-place"
                        >
                            Find a Place
                        </MagneticButton>
                        <MagneticButton
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white/20 transition-colors cursor-pointer"
                            strength={0.2}
                            href="/create-profile/list-place"
                        >
                            List Your Sublet
                        </MagneticButton>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}
