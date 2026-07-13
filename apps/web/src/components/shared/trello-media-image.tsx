'use client';

import { useEffect, useState } from 'react';
import { trelloService } from '@/services/trello.service';
import { cn } from '@/lib/utils';

interface TrelloMediaImageProps {
  url: string;
  alt?: string;
  className?: string;
}

export function TrelloMediaImage({
  url,
  alt = '',
  className,
}: TrelloMediaImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    trelloService
      .fetchMediaBlob(url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!src) {
    return (
      <div
        className={cn(
          'flex h-28 items-center justify-center rounded-xl bg-canvas text-xs text-muted',
          className,
        )}
      >
        Loading image…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('h-auto w-full rounded-xl object-cover', className)}
    />
  );
}
