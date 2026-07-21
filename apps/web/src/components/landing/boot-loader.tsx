'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const MIN_MS = 280;
const BOOT_KEY = 'lp-booted';

declare global {
  interface Window {
    __lpBootStart?: number;
  }
}

function hasSeenBoot() {
  try {
    return sessionStorage.getItem(BOOT_KEY) === '1';
  } catch {
    return false;
  }
}

function markBootSeen() {
  try {
    sessionStorage.setItem(BOOT_KEY, '1');
  } catch {
    /* ignore */
  }
}

function finishBoot() {
  document.documentElement.classList.remove('lp-booting');
  window.dispatchEvent(new Event('lp-ready'));
}

export function BootLoader({ ready }: { ready: boolean }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useLayoutEffect(() => {
    if (!hasSeenBoot()) return;
    setSkipped(true);
    setVisible(false);
    finishBoot();
  }, []);

  useEffect(() => {
    if (skipped || hasSeenBoot()) return;

    if (!window.__lpBootStart) window.__lpBootStart = performance.now();
    document.documentElement.classList.add('lp-booting');

    return () => {
      document.documentElement.classList.remove('lp-booting');
    };
  }, [skipped]);

  useEffect(() => {
    if (skipped || !ready || !visible || leaving) return;

    const started = window.__lpBootStart ?? performance.now();
    const wait = Math.max(0, MIN_MS - (performance.now() - started));
    const t = window.setTimeout(() => {
      markBootSeen();
      setLeaving(true);
      finishBoot();
      window.setTimeout(() => setVisible(false), 200);
    }, wait);

    return () => window.clearTimeout(t);
  }, [skipped, ready, visible, leaving]);

  if (!visible || skipped) return null;

  return (
    <div
      id="lp-boot-loader"
      className={leaving ? 'is-leaving' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        background: '#faf7f2',
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
        opacity: leaving ? 0 : 1,
        visibility: leaving ? 'hidden' : 'visible',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
      aria-busy={!leaving}
      aria-live="polite"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              background: 'linear-gradient(135deg, #e85a38, #ff8a6a)',
              boxShadow: '0 8px 24px rgba(232, 90, 56, 0.35)',
            }}
          >
            W
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1c2434', letterSpacing: '-0.02em' }}>
              Workhub
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Loading workspace…</div>
          </div>
        </div>
        <div
          style={{
            width: 128,
            height: 3,
            borderRadius: 999,
            background: '#e8e2d9',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #e85a38, #ff8a6a)',
              animation: leaving ? 'none' : 'lp-boot-slide 0.9s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
