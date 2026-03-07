import Hero from "@/components/Hero";
import ScrollTicker from "@/components/ScrollTicker";
import CityGrid from "@/components/CityGrid";
import SocialProof from "@/components/SocialProof";
import HowItWorks from "@/components/HowItWorks";

import CTASection from "@/components/CTASection";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col overflow-hidden bg-background">
      <header className="absolute top-0 w-full px-6 py-6 lg:px-10 z-50 flex justify-between items-center pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground cursor-pointer"
        >
          SUBLET-<span className="text-accent">ME</span>
        </Link>
        <div className="pointer-events-auto">
          <a
            className="bg-transparent text-foreground border border-warm-gray text-sm md:text-base font-semibold px-6 py-2.5 rounded-full hover:border-foreground/30 transition-colors cursor-pointer shadow-sm"
            href="/login?returnTo=/create-profile"
          >
            Log in
          </a>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full">
        <Hero />
        <ScrollTicker />
        <CityGrid />
        <SocialProof />
        <HowItWorks />

        <CTASection />
      </div>
    </main>
  );
}
