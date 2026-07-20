'use client';

import type { RefObject } from 'react';
import {
  AIChatSection,
  BuiltFor,
  CTA,
  HowItWorks,
  Integrations,
  KnowledgeSection,
  LandingFooter,
  Pillars,
  Platform,
  Testimonials,
} from './sections';

export function BelowFold({
  progressLineRef,
}: {
  progressLineRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <Pillars />
      <Platform />
      <AIChatSection />
      <KnowledgeSection />
      <Integrations />
      <HowItWorks progressLineRef={progressLineRef} />
      <Testimonials />
      <BuiltFor />
      <CTA />
      <LandingFooter />
    </>
  );
}
