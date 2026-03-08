"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const cities = [
    {
        name: "Toronto",
        label: "Finance & Tech",
        listings: "580+",
        image: "https://images.unsplash.com/photo-1756172603176-23479ac4139b?q=80&w=1400&auto=format&fit=crop",
    },
    {
        name: "Waterloo",
        label: "Engineering Hub",
        listings: "320+",
        image: "https://images.unsplash.com/photo-1747502064507-ed08d79802db?q=80&w=1400&auto=format&fit=crop",
    },
    {
        name: "Vancouver",
        label: "West Coast Tech",
        listings: "410+",
        image: "https://images.unsplash.com/photo-1660143158587-bddffa026e06?q=80&w=1400&auto=format&fit=crop",
    },
    {
        name: "Ottawa",
        label: "Government & Tech",
        listings: "210+",
        image: "https://images.unsplash.com/photo-1576616944191-51d3959ed5cc?q=80&w=1400&auto=format&fit=crop",
    },
    {
        name: "Montreal",
        label: "AI & Culture",
        listings: "350+",
        image: "https://images.unsplash.com/photo-1575540576545-3db8561c29e4?q=80&w=1400&auto=format&fit=crop",
    },
];

export default function CityGrid() {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [scrollRange, setScrollRange] = useState(0);

    useEffect(() => {
        const updateScrollRange = () => {
            if (trackRef.current) {
                // Determine the exact distance needed to scroll to the end of the last item
                const range = trackRef.current.scrollWidth - window.innerWidth;
                setScrollRange(range > 0 ? range : 0);
            }
        };

        updateScrollRange();
        window.addEventListener("resize", updateScrollRange);
        return () => window.removeEventListener("resize", updateScrollRange);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end end"],
    });

    // Translate dynamically based on the exact pixel width remaining
    const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);

    return (
        <section className="relative">
            {/* Horizontal scroll container — decreased height to 140vh to reduce scrolling dead space below the images */}
            <div ref={containerRef} className="h-[100vh] sm:h-[120vh] md:h-[140vh] relative">
                <div className="sticky top-0 h-screen overflow-hidden flex flex-col pt-20 sm:pt-24 lg:pt-28">
                    {/* Header inside sticky area */}
                    <div className="max-w-[1400px] px-6 lg:px-10 pb-8 sm:pb-14">
                        <motion.p
                            className="text-accent font-semibold text-sm tracking-widest uppercase mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            Where to next
                        </motion.p>
                        <motion.h2
                            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        >
                            Every co-op city,{" "}
                            <span className="text-muted/40">one scroll away.</span>
                        </motion.h2>
                    </div>

                    {/* Added w-max here to ensure the percentage translation (-100%) acts on the full combined width of all children */}
                    <motion.div
                        ref={trackRef}
                        className="flex gap-6 pl-6 lg:pl-10 w-max"
                        style={{ x }}
                    >
                        {cities.map((city, i) => (
                            <CityPanel key={city.name} city={city} index={i} />
                        ))}

                        {/* End spacer with CTA */}
                        <div className="flex-shrink-0 w-[300px] md:w-[400px] flex items-center justify-center">
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                <p className="font-serif text-2xl md:text-3xl text-muted/50 mb-4">
                                    + 12 more cities
                                </p>
                                <span className="text-accent font-semibold text-sm uppercase tracking-widest">
                                    View all →
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function CityPanel({ city, index }: { city: typeof cities[0]; index: number }) {
    return (
        <motion.div
            className="flex-shrink-0 w-[75vw] sm:w-[65vw] md:w-[40vw] lg:w-[30vw] h-[45vh] sm:h-[55vh] md:h-[60vh] relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px -100px" }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
        >
            {/* Image with parallax on hover */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                style={{ backgroundImage: `url('${city.image}')` }}
            />

            {/* Dark overlay that lightens on hover */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors duration-700" />

            {/* Giant outlined city name — the editorial signature */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <span
                    className="font-serif text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] leading-none select-none text-transparent uppercase tracking-tighter opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                    style={{
                        WebkitTextStroke: "2px rgba(255,255,255,0.6)",
                    }}
                >
                    {city.name.slice(0, 3)}
                </span>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 md:p-9 z-10">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-1 sm:mb-2">
                            {city.label}
                        </p>
                        <h3 className="font-serif text-white text-3xl sm:text-4xl md:text-5xl leading-none tracking-tight">
                            {city.name}
                        </h3>
                    </div>
                    <div className="text-right">
                        <span className="text-white/80 text-xl sm:text-2xl md:text-3xl font-serif">
                            {city.listings}
                        </span>
                        <p className="text-white/40 text-xs font-medium mt-0.5">sublets</p>
                    </div>
                </div>

                {/* Hover reveal line */}
                <motion.div
                    className="mt-5 h-px bg-white/20 origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: [0.33, 1, 0.68, 1] }}
                />
            </div>

            {/* Top-right arrow that appears on hover */}
            <div className="absolute top-7 right-7 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
            </div>
        </motion.div>
    );
}
