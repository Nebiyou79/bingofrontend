// components/giovani/icons/index.ts
import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
}

const createIcon = (src: string, alt: string) => {
  const IconComponent: React.FC<IconProps> = ({ className = '', size = 32 }) => {
    return React.createElement('img', {
      src,
      alt,
      width: size,
      height: size,
      className: `select-none ${className}`,
      draggable: false,
    });
  };
  IconComponent.displayName = `Icon(${alt})`;
  return IconComponent;
};

// Use public paths
export const TenIcon = createIcon('/icons/giovani/ten.png', '10');
export const JackIcon = createIcon('/icons/giovani/jack.png', 'J');
export const QueenIcon = createIcon('/icons/giovani/queen.png', 'Queen');
export const KingIcon = createIcon('/icons/giovani/king.png', 'King');
export const AceIcon = createIcon('/icons/giovani/ace.png', 'Ace');
export const GemIcon = createIcon('/icons/giovani/gem.png', 'Gem');
export const LionIcon = createIcon('/icons/giovani/lion.png', 'Lion');
export const CrownIcon = createIcon('/icons/giovani/crown.png', 'Crown');
export const ChestIcon = createIcon('/icons/giovani/chest.png', 'Chest');

export type IconComponent = React.FC<IconProps>;