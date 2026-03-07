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
      <header className="absolute top-0 w-full px-6 py-6 lg:px-10 z-50 flex justify-end items-center pointer-events-none">
        <div className="pointer-events-auto">
          <Link
            className="bg-transparent text-foreground border border-warm-gray text-sm md:text-base font-semibold px-6 py-2.5 rounded-full hover:border-foreground/30 transition-colors cursor-pointer shadow-sm"
            href="/login?returnTo=/create-profile"
          >
            Log in
          </Link>
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
