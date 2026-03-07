"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";

const SPRING = { damping: 15, stiffness: 150, mass: 0.1 };
const ARROW_SPRING = { type: "spring" as const, stiffness: 400, damping: 22 };

function ButtonInner({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.button
            className={`${className} overflow-hidden cursor-pointer`}
            onClick={onClick}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileTap={{ scale: 0.97 }}
        >
            <span className="relative flex items-center justify-center gap-0">
                <motion.span
                    animate={{ x: hovered ? -6 : 0 }}
                    transition={ARROW_SPRING}
                    className="inline-block"
                >
                    {children}
                </motion.span>
                <AnimatePresence>
                    {hovered && (
                        <motion.span
                            key="arrow"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 4 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={ARROW_SPRING}
                            className="absolute right-0 translate-x-full"
                            aria-hidden
                        >
                            →
                        </motion.span>
                    )}
                </AnimatePresence>
            </span>
        </motion.button>
    );
}

function LinkInner({ children, className, href }: { children: React.ReactNode; className?: string; href: string }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileTap={{ scale: 0.97 }}
        >
            <Link href={href} className={`${className} overflow-hidden flex items-center justify-center cursor-pointer`}>
                <span className="relative flex items-center justify-center gap-0">
                    <motion.span
                        animate={{ x: hovered ? -6 : 0 }}
                        transition={ARROW_SPRING}
                        className="inline-block"
                    >
                        {children}
                    </motion.span>
                    <AnimatePresence>
                        {hovered && (
                            <motion.span
                                key="arrow"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 4 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={ARROW_SPRING}
                                className="absolute right-0 translate-x-full"
                                aria-hidden
                            >
                                →
                            </motion.span>
                        )}
                    </AnimatePresence>
                </span>
            </Link>
        </motion.div>
    );
}

export default function MagneticButton({
    children,
    className = "",
    strength = 0.3,
    onClick,
    href,
}: {
    children: React.ReactNode;
    className?: string;
    strength?: number;
    onClick?: () => void;
    href?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, SPRING);
    const springY = useSpring(y, SPRING);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * strength);
        y.set((e.clientY - centerY) * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className="inline-block"
        >
            {href ? (
                <LinkInner href={href} className={className}>{children}</LinkInner>
            ) : (
                <ButtonInner className={className} onClick={onClick}>{children}</ButtonInner>
            )}
        </motion.div>
    );
}

