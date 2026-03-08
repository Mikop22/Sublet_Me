"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.span
            ref={ref}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-background tabular-nums"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            {isInView ? `${value.toLocaleString()}${suffix}` : `0${suffix}`}
        </motion.span>
    );
}

const stats = [
    { value: 10, suffix: "k+", label: "Sublets listed" },
    { value: 4200, suffix: "+", label: "Students matched" },
    { value: 98, suffix: "%", label: "Satisfaction rate" },
];

export default function SocialProof() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "center center"],
    });
    const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

    return (
        <section ref={sectionRef} className="pt-0 pb-10 sm:pb-16 px-4 sm:px-6 lg:px-10 -mt-6 sm:-mt-12 md:-mt-24 lg:-mt-32 relative z-20">
            <motion.div
                className="max-w-[1400px] mx-auto bg-foreground rounded-[1.5rem] sm:rounded-[2.5rem] py-10 sm:py-16 md:py-20 px-5 sm:px-8 md:px-16 relative overflow-hidden"
                style={{ scale }}
            >
                {/* Subtle grain on dark surface */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <svg width="100%" height="100%">
                        <defs>
                            <filter id="noise-social">
                                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                            </filter>
                        </defs>
                        <rect width="100%" height="100%" filter="url(#noise-social)" />
                    </svg>
                </div>

                {/* Accent glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10">
                    <motion.p
                        className="text-accent font-semibold text-sm tracking-widest uppercase mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Trusted by students
                    </motion.p>
                    <motion.h2
                        className="font-serif text-2xl sm:text-3xl md:text-4xl text-background/90 mb-8 sm:mb-14 max-w-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        The #1 co-op housing network in Canada.
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className={`${i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                            >
                                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                <p className="text-background/40 text-sm font-medium mt-2">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
