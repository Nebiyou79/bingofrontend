// components/giovani/icons/IconWrapper.tsx
import React from 'react';

interface IconWrapperProps {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  src, 
  alt, 
  className = '',
  size = 32,
}) => {
  return (
    <img 
      src={src} 
      alt={alt}
      width={size}
      height={size}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
};