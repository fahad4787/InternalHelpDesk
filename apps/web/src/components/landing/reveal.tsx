'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

const hidden: Record<RevealVariant, { opacity: number; x?: number; y?: number; scale?: number }> = {
  up: { opacity: 0, y: 16 },
  down: { opacity: 0, y: -12 },
  left: { opacity: 0, x: -20 },
  right: { opacity: 0, x: 20 },
  fade: { opacity: 0 },
  scale: { opacity: 0, scale: 0.96 },
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  soft?: boolean;
} & Omit<HTMLMotionProps<'div'>, 'children' | 'initial' | 'whileInView' | 'viewport' | 'transition'>;

export function Reveal({
  children,
  className,
  variant = 'up',
  delay = 0,
  soft = false,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={hidden[variant]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -6% 0px' }}
      transition={{
        duration: soft ? 0.55 : 0.45,
        delay: Math.max(0, delay) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
