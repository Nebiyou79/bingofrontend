// // components/pool/StakeConfirmModal.tsx
// 'use client';

// import type { RoomSnapshot } from '../../types/pool';
// import { MODE_LABELS } from '../../lib/pool.constants';

// interface StakeConfirmModalProps {
//   room: RoomSnapshot;
//   onConfirm: () => void;
//   onCancel: () => void;
//   joining: boolean;
// }

// export function StakeConfirmModal({ room, onConfirm, onCancel, joining }: StakeConfirmModalProps) {
//   const modeLabel = MODE_LABELS[room.mode] ?? room.mode;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm px-4">
//       <div
//         className="
//           w-full max-w-sm
//           bg-gradient-to-b from-zinc-900 to-zinc-950
//           border border-white/10 rounded-3xl shadow-2xl
//           animate-in fade-in zoom-in-95 duration-200
//         "
//         style={{ fontFamily: "'DM Sans', sans-serif" }}
//       >
//         <div className="px-7 py-7">
//           {/* Header */}
//           <div className="text-center mb-6">
//             <div className="text-3xl mb-3">🎱</div>
//             <h2 className="text-white font-black text-xl">Confirm Entry</h2>
//             <p className="text-white/40 text-sm mt-1">{modeLabel} · Room {room.roomNumber}</p>
//           </div>

//           {/* Stake breakdown */}
//           <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
//             <div className="flex justify-between items-center">
//               <span className="text-white/50 text-sm">Your stake</span>
//               <span className="text-white font-bold text-base">{room.stake} ብር</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-white/50 text-sm">House cut</span>
//               <span className="text-white/60 text-sm">{room.houseCut} ብር</span>
//             </div>
//             <div className="border-t border-white/10 pt-3 flex justify-between items-center">
//               <span className="text-emerald-400/80 text-sm font-semibold">Winner receives</span>
//               <span className="text-emerald-400 font-black text-lg">{room.winnerPayout} ብር</span>
//             </div>
//           </div>

//           <p className="text-white/30 text-xs text-center mb-5">
//             {room.stake} ብር will be deducted from your balance immediately.
//             Refunded automatically if no opponent joins.
//           </p>

//           {/* Actions */}
//           <div className="flex gap-3">
//             <button
//               onClick={onCancel}
//               disabled={joining}
//               className="
//                 flex-1 py-3 rounded-2xl font-semibold text-sm
//                 bg-white/8 hover:bg-white/14 active:scale-95 disabled:opacity-50
//                 text-white/60 border border-white/10 transition-all duration-150
//               "
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               disabled={joining}
//               className="
//                 flex-1 py-3 rounded-2xl font-bold text-sm
//                 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-70
//                 text-white shadow-lg shadow-emerald-900/40 transition-all duration-150
//                 flex items-center justify-center gap-2
//               "
//             >
//               {joining ? (
//                 <>
//                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Joining…
//                 </>
//               ) : (
//                 `Join for ${room.stake} ብር`
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }