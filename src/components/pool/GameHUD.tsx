// components/pool/GameHUD.tsx
'use client';

import type { PoolGameState } from '../../types/pool';
import { GameHUDEthiopian } from './GameHUDEthiopian';
import { GameHUD8Ball } from './GameHUD8Ball';

interface GameHUDProps {
  gameState:     PoolGameState;
  power:         number;
  isAiming:      boolean;
  myUserId:      string;
  stake:         number;
  onForfeit:     () => void;
  onDismissFoul: () => void;
}

export function GameHUD({ gameState, power, isAiming, myUserId, stake, onForfeit, onDismissFoul }: GameHUDProps) {
  const props = { gameState, power, isAiming, myUserId, stake, onForfeit, onDismissFoul };
  if (gameState.mode === 'ethiopian') return <GameHUDEthiopian {...props} />;
  return <GameHUD8Ball {...props} />;
}