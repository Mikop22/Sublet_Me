"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import MagneticButton from "./MagneticButton";

function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
    const words = text.split(" ");
    return (
        <span className={className}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.3em] last:mr-0 pb-[0.15em]">
                    <motion.span
                        className="inline-block"
                        initial={{ y: "110%", rotate: 3 }}
                        animate={{ y: "0%", rotate: 0 }}
                        transition={{
                            duration: 0.7,
                            delay: delay + i * 0.06,
                            ease: [0.33, 1, 0.68, 1],
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}

function FloatingMatchCard({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const y = useTransform(scrollProgress, [0, 1], [0, -80]);

    return (
        <motion.div
            className="absolute bottom-12 -left-8 lg:-left-16 z-20 bg-surface rounded-2xl p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)] border border-warm-gray/20 w-72"
            style={{ y }}
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex items-center gap-3 mb-3.5">
                <div className="flex -space-x-2">
                    <img
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&h=100&auto=format&fit=crop&crop=face"
                        alt=""
                        className="w-9 h-9 rounded-full border-2 border-surface object-cover"
                    />
                    <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&h=100&auto=format&fit=crop&crop=face"
                        alt=""
                        className="w-9 h-9 rounded-full border-2 border-surface object-cover"
                    />
                </div>
            </div>
            <p className="font-serif text-lg text-foreground mb-0.5">May 1 - Aug 31</p>
            <p className="text-sm text-muted">McMaster Student ↔ Toronto Listing</p>
        </motion.div>
    );
}

function FloatingLocationBadge({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
    const y = useTransform(scrollProgress, [0, 1], [0, -40]);

    return (
        <motion.div
            className="absolute top-16 -right-4 lg:-right-8 z-20 bg-surface rounded-xl px-4 py-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] border border-warm-gray/20"
            style={{ y }}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">Downtown Toronto</p>
                    <p className="text-xs text-muted font-medium">$890/mo</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const imageOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen flex items-center pt-8 pb-16 lg:pb-0 overflow-hidden"
        >
            {/* Soft background glow */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-sage/[0.06] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
                    {/* Left Content — 55% */}
                    <div className="flex-[1.2] lg:pr-8 z-10 text-center lg:text-left">
                        {/* Headline */}
                        <h1 className="font-serif text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.9] tracking-tight mb-6">
                            <WordReveal text="Find your" delay={0.2} />
                            <br className="hidden sm:block" />
                            <WordReveal text="home for the" delay={0.4} />
                            <br className="hidden sm:block" />
                            <span className="text-accent">
                                <WordReveal text="summer." delay={0.65} />
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <motion.p
                            className="text-lg md:text-xl text-muted max-w-lg mx-auto lg:mx-0 leading-relaxed mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                        >
                            The exclusive sublet network for Canadian co-op students.
                            Verified students, matching dates, zero stress.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.05 }}
                        >
                            <MagneticButton
                                className="bg-accent text-white text-base font-semibold px-8 py-4 rounded-full shadow-[0_8px_30px_rgba(232,93,74,0.3)] cursor-pointer hover:shadow-[0_12px_40px_rgba(232,93,74,0.4)] transition-shadow"
                                href="/create-profile/find-place"
                            >
                                I need a sublet
                            </MagneticButton>
                            <MagneticButton
                                className="bg-transparent text-foreground border border-warm-gray text-base font-semibold px-8 py-4 rounded-full hover:border-foreground/30 transition-colors cursor-pointer"
                                strength={0.2}
                                href="/create-profile/list-place"
                            >
                                List my place
                            </MagneticButton>
                        </motion.div>

                    </div>

                    {/* Right Visual — 45% */}
                    <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
                        <motion.div
                            className="relative aspect-[3/4] lg:aspect-[4/5] rounded-[2rem] overflow-hidden"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: "url('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop')",
                                    scale: imageScale,
                                    opacity: imageOpacity,
                                }}
                            />
                            {/* Warm gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
                        </motion.div>

                        {/* Floating elements with parallax */}
                        <FloatingLocationBadge scrollProgress={scrollYProgress} />
                        <FloatingMatchCard scrollProgress={scrollYProgress} />
                    </div>
                </div>
            </div>
        </section>
    );
}
