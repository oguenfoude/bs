/**
 * Skeleton Loading Component with Shimmer Animation
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'button' | 'card';
}

export default function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]';
  
  const variantClasses = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-xl h-12',
    card: 'rounded-2xl',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      aria-label="Loading..."
      role="status"
    />
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
        'rounded-xl h-14 w-full',
        className
      )}
      aria-label="Processing..."
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-6 bg-white rounded-2xl shadow-lg', className)}>
      <Skeleton variant="text" className="h-6 w-3/4" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-5/6" />
      <Skeleton variant="button" className="h-10 w-full" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}
