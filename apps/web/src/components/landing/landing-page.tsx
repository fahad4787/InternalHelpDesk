'use client';

import { useCursorGlow, useReveal, useScrollProgress } from './hooks';
import { LandingNav } from './nav';
import { LandingHero } from './hero';
import {
  AIChatSection,
  BuiltFor,
  CTA,
  HowItWorks,
  Integrations,
  KnowledgeSection,
  LandingFooter,
  LogoMarquee,
  Pillars,
  Platform,
  Testimonials,
} from './sections';
import './landing.css';

export function LandingPage() {
  useReveal();
  useCursorGlow();
  const progress = useScrollProgress();

  return (
    <div className="lp-radiant relative min-h-screen overflow-x-hidden text-foreground">
      {/* Cursor spotlight (desktop) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] hidden md:block"
        style={{
          background:
            'radial-gradient(280px 280px at var(--mx,50%) var(--my,50%), oklch(0.78 0.16 45 / 0.14), transparent 70%)',
        }}
      />

      {/* Global noise + mesh */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 animate-mesh-shift mesh-bg opacity-90" />
        <div className="noise-overlay" />
      </div>

      {/* Scroll progress bar */}
      <div className="fixed inset-x-0 top-0 z-[70] h-[3px] bg-transparent">
        <div
          className="h-full origin-left"
          style={{
            transform: `scaleX(${progress})`,
            background:
              'linear-gradient(90deg, oklch(0.7 0.19 35), oklch(0.78 0.16 45), oklch(0.85 0.08 140))',
            boxShadow: '0 0 12px oklch(0.78 0.16 45 / 0.6)',
          }}
        />
      </div>

      <LandingNav />
      <LandingHero />
      <LogoMarquee />
      <Pillars />
      <Platform />
      <AIChatSection />
      <KnowledgeSection />
      <Integrations />
      <HowItWorks />
      <Testimonials />
      <BuiltFor />
      <CTA />
      <LandingFooter />
    </div>
  );
}
