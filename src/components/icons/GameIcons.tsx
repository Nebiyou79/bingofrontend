// components/icons/GameIcons.tsx
/**
 * DashBets — Shared game iconography
 *
 * Game icons now use generated PNG images with responsive sizing support.
 * Images should be placed in /public/images/game-icons/
 *
 * Every icon supports:
 * - `size` prop for base size (applies to mobile)
 * - `smSize` prop for responsive sizing on larger screens
 * - `className` for additional Tailwind classes
 */

import React from 'react';

export interface IconProps {
  size?: number;
  /** Size to use on `sm:` breakpoint and above (defaults to `size` if not provided) */
  smSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Image paths - update these to match your actual file names and locations
const ICON_PATHS = {
  gem: '/images/game-icons/gem.png',
  bomb: '/images/game-icons/bomb.png',
  rock: '/images/game-icons/rock.png',
  paper: '/images/game-icons/paper.png',
  scissors: '/images/game-icons/scissors.png',
} as const;

/**
 * Helper: returns a responsive className based on size/smSize props.
 * Uses Tailwind width/height utility classes for responsive sizing.
 */
function useResponsiveSize(size: number, smSize?: number): string {
  // Map common pixel sizes to Tailwind classes
  const sizeMap: Record<number, string> = {
    10: 'w-2.5 h-2.5',
    11: 'w-[11px] h-[11px]',
    12: 'w-3 h-3',
    13: 'w-[13px] h-[13px]',
    14: 'w-3.5 h-3.5',
    16: 'w-4 h-4',
    18: 'w-[18px] h-[18px]',
    20: 'w-5 h-5',
    22: 'w-[22px] h-[22px]',
    24: 'w-6 h-6',
    28: 'w-7 h-7',
    32: 'w-8 h-8',
    36: 'w-9 h-9',
    40: 'w-10 h-10',
    48: 'w-12 h-12',
    56: 'w-14 h-14',
    64: 'w-16 h-16',
  };

  const mobile = sizeMap[size] || `w-[${size}px] h-[${size}px]`;
  
  if (!smSize || smSize === size) return mobile;
  
  const desktop = sizeMap[smSize] || `sm:w-[${smSize}px] sm:h-[${smSize}px]`;
  return `${mobile} ${desktop}`;
}

export function IconGem({ size = 24, smSize, className = '', style }: IconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <img
      src={ICON_PATHS.gem}
      alt="Gem"
      className={`${responsiveClass} ${className}`}
      style={{ display: 'inline-block', ...style }}
      // Remove width/height attributes when using className for sizing
      // to avoid conflicts
    />
  );
}

export function IconBomb({ size = 24, smSize, className = '', style }: IconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <img
      src={ICON_PATHS.bomb}
      alt="Bomb"
      className={`${responsiveClass} ${className}`}
      style={{ display: 'inline-block', ...style }}
    />
  );
}

export function IconRock({ size = 24, smSize, className = '', style }: IconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <img
      src={ICON_PATHS.rock}
      alt="Rock"
      className={`${responsiveClass} ${className}`}
      style={{ display: 'inline-block', ...style }}
    />
  );
}

export function IconPaper({ size = 24, smSize, className = '', style }: IconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <img
      src={ICON_PATHS.paper}
      alt="Paper"
      className={`${responsiveClass} ${className}`}
      style={{ display: 'inline-block', ...style }}
    />
  );
}

export function IconScissors({ size = 24, smSize, className = '', style }: IconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <img
      src={ICON_PATHS.scissors}
      alt="Scissors"
      className={`${responsiveClass} ${className}`}
      style={{ display: 'inline-block', ...style }}
    />
  );
}

// Group export for Rock-Paper-Scissors (backward compatible)
export const RPS_ICONS = {
  rock: IconRock,
  paper: IconPaper,
  scissors: IconScissors,
} as const;

// ============================================================
// Keep remaining SVG icons with responsive sizing support
// ============================================================

function strokeProps(strokeWidth: number) {
  return {
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

/** Extended props for SVG icons that want responsive sizing too */
interface SvgIconProps extends IconProps {
  strokeWidth?: number;
  direction?: 'up' | 'down';
}

export function IconTrophy({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.5, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg 
      className={`${responsiveClass} ${className}`} 
      viewBox="0 0 24 24" 
      style={style}
    >
      <path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z" fill="currentColor" fillOpacity="0.16" {...strokeProps(strokeWidth)} />
      <path d="M7 5H4.5v1.8A3 3 0 0 0 7.5 9.8M17 5h2.5v1.8A3 3 0 0 1 16.5 9.8" {...strokeProps(strokeWidth)} />
      <path d="M12 12v3.2M9 19.5h6M10.2 19.5v-2a1.8 1.8 0 0 1 3.6 0v2" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconOutcomeLoss({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.6, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.14" {...strokeProps(strokeWidth)} />
      <path d="M9 9l6 6M15 9l-6 6" fill="none" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconOutcomeTie({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.6, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.14" {...strokeProps(strokeWidth)} />
      <path d="M7.5 10h9M7.5 14h9" fill="none" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconCoin({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.5, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.14" {...strokeProps(strokeWidth)} />
      <path d="M12 6.8v10.4M9.6 9.2c0-1.1 1.1-1.9 2.4-1.9s2.4.7 2.4 1.7c0 2.3-4.8 1.1-4.8 3.5 0 1 1 1.8 2.4 1.8s2.5-.8 2.5-1.9" fill="none" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconLink({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.7, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <rect x="3" y="9" width="8.5" height="6" rx="3" fill="none" {...strokeProps(strokeWidth)} />
      <rect x="12.5" y="9" width="8.5" height="6" rx="3" fill="none" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconBolt({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.5, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" fillOpacity="0.18" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconLock({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.5, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" fillOpacity="0.14" {...strokeProps(strokeWidth)} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" {...strokeProps(strokeWidth)} />
      <circle cx="12" cy="15.3" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 2, 
  style 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg className={`${responsiveClass} ${className}`} viewBox="0 0 24 24" style={style}>
      <path d="M5 13l4 4L19 7" fill="none" {...strokeProps(strokeWidth)} />
    </svg>
  );
}

export function IconChevron({ 
  size = 24, 
  smSize, 
  className = '', 
  strokeWidth = 1.8, 
  style, 
  direction = 'down' 
}: SvgIconProps) {
  const responsiveClass = useResponsiveSize(size, smSize);
  return (
    <svg
      className={`${responsiveClass} ${className}`}
      viewBox="0 0 24 24"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s', ...style }}
    >
      <path d="M6 9l6 6 6-6" {...strokeProps(strokeWidth)} />
    </svg>
  );
}