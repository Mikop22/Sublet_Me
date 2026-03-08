"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const steps = [
    {
        number: "01",
        title: "Verify your identity",
        description: "Sign up with your .edu or .ca email address. We manually verify every student to keep the network exclusively for real co-op students.",
        visual: "shield",
        bg: "bg-foreground",
        text: "text-background",
        mutedText: "text-background/50",
        accentBg: "bg-accent",
        image: "https://images.unsplash.com/photo-1627556704302-624286467c65?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        number: "02",
        title: "Fill out your profile",
        description: "Tell us about your co-op term, budget, and lifestyle. The more details you add, the better matches you'll get.",
        visual: "calendar",
        bg: "bg-accent",
        text: "text-white",
        mutedText: "text-white/60",
        accentBg: "bg-white",
        image: "https://images.unsplash.com/photo-1541560052-5e137f229371?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        number: "03",
        title: "Tour virtually",
        description: "Browse verified listings with real photos. Hop on encrypted video calls to tour apartments and meet hosts face-to-face before committing.",
        visual: "eye",
        bg: "bg-sage",
        text: "text-foreground",
        mutedText: "text-foreground/60",
        accentBg: "bg-foreground",
        video: "/videocall.mp4",
    },
    {
        number: "04",
        title: "Move in",
        description: "Sign your sublease digitally. Split payments through the platform. Show up on day one to a home that's already yours.",
        visual: "key",
        bg: "bg-[#2D2926]",
        text: "text-background",
        mutedText: "text-background/50",
        accentBg: "bg-accent",
        image: "https://images.unsplash.com/photo-1737442886747-9fb768b96ed2?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
];

function StepVisual({ visual, accentBg }: { visual: string; accentBg: string }) {
    const icons: Record<string, React.ReactNode> = {
        shield: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        calendar: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        eye: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
        key: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
    };

    return (
        <div className={`w-16 h-16 rounded-2xl ${accentBg} text-white flex items-center justify-center`}>
            {icons[visual]}
        </div>
    );
}

function StickyCard({ step, index, totalSteps }: { step: typeof steps[0]; index: number; totalSteps: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isInView = useInView(cardRef, { margin: "-30% 0px -30% 0px" });
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "start start"],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isInView) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    }, [isInView]);

    return (
        <div ref={cardRef} className="min-h-[80vh] sm:h-screen flex items-center sticky top-0" style={{ zIndex: index + 1 }}>
            {/* Wrapper handles the scroll animations for both the card and the detached image simultaneously */}
            <motion.div
                className="relative w-full max-w-[1400px] mx-auto"
                style={{ scale, opacity, marginLeft: `${index * 8}px`, marginRight: `${index * 8}px` }}
            >
                <div
                    className={`${step.bg} w-full rounded-[2.5rem] overflow-hidden relative`}
                >
                    {/* Subtle noise */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <svg width="100%" height="100%">
                            <defs>
                                <filter id={`noise-step-${index}`}>
                                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                                </filter>
                            </defs>
                            <rect width="100%" height="100%" filter={`url(#noise-step-${index})`} />
                        </svg>
                    </div>

                    <div className="relative z-10 px-5 sm:px-8 md:px-14 lg:px-20 py-10 sm:py-16 md:py-20 lg:py-24 min-h-[55vh] sm:min-h-[65vh] md:min-h-[70vh] flex flex-col justify-between">
                        {/* Top row — number and step count */}
                        <div className="flex items-start justify-between mb-6 sm:mb-12 md:mb-16">
                            <span className={`font-serif text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] leading-none ${step.mutedText} select-none tracking-tighter opacity-30`}>
                                {step.number}
                            </span>
                        </div>

                        {/* Bottom content */}
                        <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                            <div className="flex-1 max-w-2xl">
                                <div className="flex items-center gap-4 mb-5">
                                    <StepVisual visual={step.visual} accentBg={step.accentBg} />
                                </div>
                                <h3 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${step.text} leading-[1.05] tracking-tight mb-3 sm:mb-4`}>
                                    {step.title}
                                </h3>
                                <p className={`${step.mutedText} text-sm sm:text-base md:text-lg leading-relaxed max-w-lg`}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step image — OUTSIDE overflow-hidden so all rounded corners show */}
                <div
                    className="hidden lg:flex absolute top-0 bottom-0 right-8 xl:right-12 flex-col justify-center items-center"
                >
                    <div className="w-[330px] h-[390px] xl:w-[528px] xl:h-[624px] rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35),0_8px_20px_-6px_rgba(0,0,0,0.2)]">
                        {step.video ? (
                            <video
                                ref={videoRef}
                                src={step.video}
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={step.image}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function HowItWorks() {
    return (
        <section className="relative px-4 sm:px-6 lg:px-10">
            {/* Section intro */}
            <div className="max-w-[1400px] mx-auto pt-32 sm:pt-52 md:pt-72 lg:pt-[27.6rem] pb-8">
                <motion.p
                    className="text-accent font-semibold text-sm tracking-widest uppercase mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    How it works
                </motion.p>
                <motion.h2
                    className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[0.95] text-foreground mb-4"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    Four steps.<br />
                    <span className="text-muted/40">Zero stress.</span>
                </motion.h2>
            </div>

            {/* Stacking cards */}
            <div className="relative">
                {steps.map((step, i) => (
                    <StickyCard key={step.number} step={step} index={i} totalSteps={steps.length} />
                ))}
            </div>
        </section>
    );
}
