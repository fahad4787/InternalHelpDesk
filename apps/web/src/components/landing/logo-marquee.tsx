'use client';

import Link from 'next/link';
import { MARKETPLACE_APPS } from '@/constants/dashboard-integrations';
import {
  IntegrationIcon,
  isIntegrationIconProvider,
} from '@/components/integrations/common/integration-icon';
import { Marquee } from './primitives';
import { Reveal } from './reveal';

const APPS = MARKETPLACE_APPS.filter((a) => a.available);

function AppBrandIcon({ iconKey, size = 'sm' }: { iconKey: string; size?: 'sm' | 'md' }) {
  const provider = isIntegrationIconProvider(iconKey) ? iconKey : 'JIRA';
  return <IntegrationIcon provider={provider} size={size} className="shadow-none" />;
}

export function LogoMarquee() {
  return (
    <section data-tone="surface" className="lp-section relative border-y border-border/60 bg-surface/40 py-8">
      <div className="mx-auto mb-3 max-w-6xl px-4">
        <Reveal variant="fade">
          <p className="text-balance text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Everything your employees need — in one command center
          </p>
        </Reveal>
      </div>
      <Reveal variant="up" delay={1}>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <Marquee speed="slow" className="gap-3">
            {[...APPS, ...APPS].map((it, i) => (
              <Link
                key={`${it.id}-${i}`}
                href="/register"
                className="group flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-2 shadow-card transition hover:border-primary/50 hover:shadow-glow"
              >
                <AppBrandIcon iconKey={it.iconKey} size="sm" />
                <span className="whitespace-nowrap text-sm font-semibold">{it.name}</span>
              </Link>
            ))}
          </Marquee>
        </div>
      </Reveal>
    </section>
  );
}
