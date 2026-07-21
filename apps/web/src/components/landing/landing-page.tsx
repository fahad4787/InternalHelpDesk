'use client';

import { useRef } from 'react';
import { useLandingEngine } from './hooks';
import { BootLoader } from './boot-loader';
import { BelowFold } from './below-fold';
import { LandingNav } from './nav';
import { LandingHero } from './hero';
import { LogoMarquee } from './sections';
import { CursorGlow } from './cursor-glow';
import { ScrollToTop } from './scroll-to-top';
import './landing.css';

export function LandingPage() {
  const barRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const ready = useLandingEngine({ barRef, progressLineRef });

  return (
    <div className="lp-radiant relative min-h-screen overflow-x-hidden text-foreground">
      <BootLoader ready={ready} />
      <CursorGlow enabled={ready} />
      <ScrollToTop />

      <div className="fixed inset-x-0 top-0 z-[70] h-1 bg-transparent">
        <div
          ref={barRef}
          className="h-full origin-left shadow-[0_0_12px_oklch(0.7_0.19_35_/_0.55)]"
          style={{
            transform: 'scaleX(0)',
            background:
              'linear-gradient(90deg, oklch(0.7 0.19 35), oklch(0.78 0.16 45), oklch(0.85 0.08 140))',
          }}
        />
      </div>

      <LandingNav />
      <LandingHero />
      <LogoMarquee />
      <BelowFold progressLineRef={progressLineRef} />
    </div>
  );
}
