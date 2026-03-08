import Hero from "@/components/Hero";
import ScrollTicker from "@/components/ScrollTicker";
import CityGrid from "@/components/CityGrid";
import SocialProof from "@/components/SocialProof";
import HowItWorks from "@/components/HowItWorks";
import Link from "next/link";

import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <main className="min-h-screen relative flex flex-col overflow-hidden bg-background">
      <header className="absolute top-0 w-full px-4 sm:px-6 py-4 sm:py-6 lg:px-10 z-50 flex justify-between items-center pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground cursor-pointer"
        >
          SUBLET-<span className="text-accent">ME</span>
        </Link>
        <div className="pointer-events-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              className="bg-transparent text-foreground border border-warm-gray text-xs sm:text-sm md:text-base font-semibold px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-full hover:border-foreground/30 transition-colors cursor-pointer shadow-sm"
              href="/assistant"
            >
              Try assistant
            </Link>
            <Link
              className="bg-transparent text-foreground border border-warm-gray text-xs sm:text-sm md:text-base font-semibold px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-full hover:border-foreground/30 transition-colors cursor-pointer shadow-sm"
              href="/login?returnTo=/create-profile"
            >
              Log in
            </Link>
          </div>
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
