// // components/pool/GameEndModal.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import { useQueryClient } from '@tanstack/react-query';
// import type { PoolGameState } from '../../types/pool';

// interface Props {
//   gameState: PoolGameState;
//   stake:     number;
// }

// export function GameEndModal({ gameState, stake }: Props) {
//   const router      = useRouter();
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
//   }, [queryClient]);

//   const [visible, setVisible] = useState(false);
//   useEffect(() => {
//     const t = setTimeout(() => setVisible(true), 350);
//     return () => clearTimeout(t);
//   }, []);

//   const { endResult, myPlayerId, mode, turnOrder } = gameState;
//   if (!endResult || !visible) return null;

//   const isWin  = endResult.winner === myPlayerId;
//   const isDraw = endResult.reason === 'draw';
//   const outcome = isDraw ? 'draw' : isWin ? 'win' : 'loss';

//   const reasonLabel: Record<string, string> = {
//     forfeit:    'Opponent forfeited',
//     disconnect: 'Opponent disconnected',
//     draw:       'It\'s a draw',
//   };

//   const modeLabel = mode === 'ethiopian' ? 'ethiopian' : 'eightball';

//   const cleanup = () => {
//     sessionStorage.removeItem('pool_game');
//     sessionStorage.removeItem('pool_game_id');
//     sessionStorage.removeItem('pool_socket_token');
//     sessionStorage.removeItem('pool_mode');
//   };

//   return (
//     <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-sm">
//       <div
//         className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
//         style={{ fontFamily: "'DM Sans', sans-serif" }}
//       >
//         {/* Top accent bar */}
//         <div className={`h-1 w-full ${
//           outcome === 'win'  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
//           outcome === 'draw' ? 'bg-gradient-to-r from-sky-500 to-sky-400' :
//                                'bg-zinc-700'
//         }`} />

//         <div className="px-7 py-8 text-center">
//           {/* Icon */}
//           <div className="text-6xl mb-3">
//             {outcome === 'win' ? '🏆' : outcome === 'draw' ? '🤝' : '😞'}
//           </div>

//           {/* Heading */}
//           <h2 className={`text-3xl font-black mb-1 ${
//             outcome === 'win' ? 'text-amber-400' : outcome === 'draw' ? 'text-sky-400' : 'text-white/70'
//           }`}>
//             {outcome === 'win' ? 'You Win!' : outcome === 'draw' ? "It's a Draw" : 'You Lost'}
//           </h2>

//           {endResult.reason && reasonLabel[endResult.reason] && (
//             <p className="text-zinc-500 text-sm mb-4">{reasonLabel[endResult.reason]}</p>
//           )}

//           {/* Ethiopian scores */}
// {/* Ethiopian scores */}
// {mode === 'ethiopian' && endResult.scores && (
//   <div className="flex gap-3 justify-center mt-4 mb-5">
//     {(['p1', 'p2'] as const).map(slot => {
//       const isMe = (slot === 'p1' && turnOrder[0]?.userId === myPlayerId) ||
//                    (slot === 'p2' && turnOrder[1]?.userId === myPlayerId);
//       return (
//         <div key={slot} className={`flex-1 rounded-2xl px-4 py-3 border ${
//           isMe ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/[0.02]'
//         }`}>
//           <div className="text-zinc-500 text-xs mb-1">{isMe ? 'You' : 'Opponent'}</div>
//           <div className={`text-2xl font-black tabular-nums ${isMe ? 'text-white' : 'text-white/60'}`}>
//             {endResult.scores?.[slot] ?? 0}
//           </div>
//           <div className="text-zinc-600 text-xs">pts</div>
//         </div>
//       );
//     })}
//   </div>
// )}

//           {/* Prize */}
//           {outcome === 'win' && endResult.prize > 0 && (
//             <div className="mt-4 mb-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4">
//               <div className="text-amber-400/70 text-xs uppercase tracking-widest mb-1">Prize</div>
//               <div className="text-amber-400 font-black text-3xl tabular-nums">
//                 +{endResult.prize} ብር
//               </div>
//               {endResult.newBalance !== null && (
//                 <div className="text-zinc-500 text-xs mt-1">
//                   Balance: <span className="text-zinc-300 font-semibold">{endResult.newBalance} ብር</span>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Loss */}
//           {outcome === 'loss' && stake > 0 && (
//             <div className="mt-4 mb-2 bg-zinc-800/50 border border-zinc-700 rounded-2xl px-5 py-3">
//               <div className="text-zinc-500 text-xs">
//                 Stake lost: <span className="text-zinc-300">{stake} ብር</span>
//               </div>
//               {endResult.newBalance !== null && (
//                 <div className="text-zinc-600 text-xs mt-0.5">
//                   Balance: <span className="text-zinc-400">{endResult.newBalance} ብር</span>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Buttons */}
//           <div className="flex flex-col gap-2.5 mt-6">
//             <button
//               onClick={() => { cleanup(); router.push(`/pool/lobby/${modeLabel}`); }}
//               className="w-full py-3.5 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/40 transition-all duration-150"
//             >
//               Play Again
//             </button>
//             <button
//               onClick={() => { cleanup(); router.push('/pool'); }}
//               className="w-full py-3 rounded-2xl font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 transition-all duration-150"
//             >
//               Return to Lobby
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }