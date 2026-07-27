'use client';

import { useRef } from 'react';
import { useLandingEngine } from './hooks';
import { BootLoader } from './boot-loader';
import { LandingNav } from './nav';
import { LandingHero } from './hero';
import { LogoMarquee } from './sections';
import { BelowFold } from './below-fold';
import { CursorGlow } from './cursor-glow';
import { ScrollToTop } from './scroll-to-top';

export function LandingPage() {
  const barRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const ready = useLandingEngine({ barRef, progressLineRef });

  return (
    <div className="lp-root relative min-h-screen text-foreground [overflow-x:clip]">
      <BootLoader ready={ready} />
      <CursorGlow enabled={ready} />
      <ScrollToTop />

      <div className="fixed inset-x-0 top-0 z-[70] h-1 bg-transparent">
        <div
          ref={barRef}
          className="h-full origin-left shadow-glow"
          style={{
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, #ff6c49, #ff935a, #6ebc7f)',
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
