// // components/pool/GameHUD.tsx
// 'use client';

// import { useState, useEffect } from 'react';

// import type { PoolGameState } from '../../types/pool';
// import { GameHUDEthiopian } from './GameHUDEthiopian';
// import { GameHUD8Ball } from './GameHUD8Ball';

// interface GameHUDProps {
//   gameState:     PoolGameState;
//   power:         number;
//   myUserId:      string;
//   stake:         number;
//   onForfeit:     () => void;
//   onDismissFoul: () => void;
// }

// export function GameHUD({ gameState, power, myUserId, stake, onForfeit, onDismissFoul }: GameHUDProps) {
//   const props = { gameState, power, myUserId, stake, onForfeit, onDismissFoul };
//   if (gameState.mode === 'ethiopian') return <GameHUDEthiopian {...props} />;
//   return <GameHUD8Ball {...props} />;
// }