// // pages/pool/lobby/[mode].tsx
// import type { NextPage, GetServerSideProps } from 'next';
// import Head from 'next/head';
// import { useRouter } from 'next/router';
// import { useEffect, useState, useCallback, useRef } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { io, Socket } from 'socket.io-client';
// import { StakeConfirmModal } from '../../../components/pool/StakeConfirmModal';
// import { useAuthContext } from '../../../context/AuthContext';
// import type { PoolMode, RoomSnapshot } from '../../../types/pool';
// import { MODE_LABELS, API_BASE, SOCKET_NAMESPACE } from '../../../lib/pool.constants';

// // ── Data helpers ──────────────────────────────────────────────────────────────

// async function fetchRooms(): Promise<RoomSnapshot[]> {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/pool/rooms`);
//   if (!res.ok) throw new Error('Failed to load rooms');
//   const data = await res.json();
//   return data.rooms as RoomSnapshot[];
// }

// async function apiJoinRoom(roomId: string, mode: PoolMode, token: string) {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL || ''}/api/pool/rooms/${roomId}/join`,
//     {
//       method:  'POST',
//       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//       body:    JSON.stringify({ mode }),
//     }
//   );
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error ?? 'Failed to join room');
//   return data as { gameId: string; socketToken: string };
// }

// // ── Status badge ──────────────────────────────────────────────────────────────

// function StatusBadge({ room }: { room: RoomSnapshot }) {
//   const isFull    = room.occupancy >= room.maxPlayers && room.status === 'active';
//   const isWaiting = room.occupancy === 1 && room.status === 'waiting';
//   const isEmpty   = room.occupancy === 0;

//   if (isFull)    return <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />In Progress</span>;
//   if (isWaiting) return <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Waiting for opponent</span>;
//   return           <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />Waiting for players</span>;
// }

// // ── Room card ─────────────────────────────────────────────────────────────────

// function RoomCard({ room, userBalance, onJoin, joining }: {
//   room: RoomSnapshot; userBalance: number;
//   onJoin: (room: RoomSnapshot) => void; joining: boolean;
// }) {
//   const isFull    = room.occupancy >= room.maxPlayers && room.status === 'active';
//   const canAfford = userBalance >= room.stake;
//   const isCpu     = room.type === 'cpu';
//   const isWaiting = room.occupancy === 1 && room.status === 'waiting';
//   const disabled  = isFull || (!canAfford && !isCpu);

//   const stakeColor = room.stake === 0   ? 'text-zinc-400' :
//                      room.stake === 20  ? 'text-emerald-400' :
//                      room.stake === 50  ? 'text-blue-400' :
//                                           'text-amber-400';
//   const stakeBorder = room.stake === 0  ? 'border-zinc-700' :
//                       room.stake === 20 ? 'border-emerald-900/60' :
//                       room.stake === 50 ? 'border-blue-900/60' :
//                                           'border-amber-900/60';
//   const stakeTag   = room.stake === 0   ? 'bg-zinc-800 text-zinc-400' :
//                      room.stake === 20  ? 'bg-emerald-900/50 text-emerald-400' :
//                      room.stake === 50  ? 'bg-blue-900/50 text-blue-400' :
//                                           'bg-amber-900/50 text-amber-400';

//   return (
//     <div className={`rounded-2xl border p-5 transition-all duration-200 ${
//       isFull    ? 'bg-zinc-900/40 border-zinc-800 opacity-60' :
//       isWaiting ? 'bg-zinc-900 border-emerald-800/40 shadow-lg shadow-emerald-950/20' :
//                   `bg-zinc-900 ${stakeBorder}`
//     }`}>
//       {/* Header */}
//       <div className="flex items-start justify-between mb-3">
//         <div>
//           <div className="flex items-center gap-2 mb-0.5">
//             <span className="text-white font-bold text-base">Room {room.roomNumber}</span>
//             {isWaiting && <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">● Live</span>}
//           </div>
//           <StatusBadge room={room} />
//         </div>
//         <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${stakeTag}`}>
//           {room.stake === 0 ? 'FREE' : `${room.stake} ብር`}
//         </span>
//       </div>

//       {/* Occupancy dots */}
//       <div className="flex items-center gap-2 mb-3">
//         <div className="flex gap-1">
//           {Array.from({ length: room.maxPlayers }).map((_, i) => (
//             <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
//               i < room.occupancy ? 'bg-emerald-400' : 'bg-zinc-700'
//             }`} />
//           ))}
//         </div>
//         <span className="text-zinc-500 text-xs">{room.occupancy} / {room.maxPlayers} players</span>

//         {!isCpu && room.stake > 0 && room.winnerPayout && (
//           <span className="ml-auto text-zinc-500 text-xs">
//             Win <span className={`font-bold ${stakeColor}`}>{room.winnerPayout} ብར</span>
//           </span>
//         )}
//       </div>

//       {/* CTA */}
//       {!canAfford && !isCpu ? (
//         <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-3 py-2">
//           <span className="text-red-400/70 text-xs">Need {room.stake} ብር</span>
//           <a href="/wallet/deposit" className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors">
//             Add funds →
//           </a>
//         </div>
//       ) : (
//         <button
//           onClick={() => !disabled && !joining && onJoin(room)}
//           disabled={disabled || joining}
//           className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
//             disabled
//               ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
//               : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-900/30'
//           }`}
//         >
//           {joining ? (
//             <span className="flex items-center justify-center gap-2">
//               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               Joining…
//             </span>
//           ) : isFull ? 'Full' :
//             isCpu     ? 'Play vs CPU' :
//             isWaiting ? '⚡ Join & Start' :
//                         'Join Room'}
//         </button>
//       )}
//     </div>
//   );
// }

// // ── Page ──────────────────────────────────────────────────────────────────────

// const LobbyPage: NextPage<{ mode: PoolMode }> = ({ mode }) => {
//   const router      = useRouter();
//   const queryClient = useQueryClient();
//   const socketRef   = useRef<Socket | null>(null);

//   const { user, token, isAuthenticated, loading: authLoading } = useAuthContext();
//   const userBalance = (user as any)?.balance ?? 0;

//   useEffect(() => {
//     if (!authLoading && !isAuthenticated) {
//       router.replace(`/auth/login?next=/pool/lobby/${mode}`);
//     }
//   }, [authLoading, isAuthenticated, mode, router]);

//   const [rooms,       setRooms]       = useState<RoomSnapshot[]>([]);
//   const [isLoading,   setIsLoading]   = useState(true);
//   const [pendingRoom, setPendingRoom] = useState<RoomSnapshot | null>(null);
//   const [joiningId,   setJoiningId]   = useState<string | null>(null);
//   const [joinError,   setJoinError]   = useState<string | null>(null);
//   const [activeMode,  setActiveMode]  = useState<PoolMode>(mode);

//   // Fetch rooms
//   useEffect(() => {
//     setIsLoading(true);
//     fetchRooms()
//       .then(all => setRooms(all.filter(r => r.mode === activeMode)))
//       .catch(err => console.error('Failed to load rooms:', err))
//       .finally(() => setIsLoading(false));
//   }, [activeMode]);

//   // Live socket — uses main token (correct field decoded.id on server)
//   useEffect(() => {
//     if (!token) return;
//     const server = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
//     const sock = io(server + SOCKET_NAMESPACE, {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//     });
//     sock.on('pool:room_update', (update: { roomId: string; occupancy: number; status: string }) => {
//       setRooms(prev => prev.map(r =>
//         r.roomId === update.roomId
//           ? { ...r, occupancy: update.occupancy, status: update.status as RoomSnapshot['status'] }
//           : r
//       ));
//     });
//     socketRef.current = sock;
//     return () => { sock.disconnect(); };
//   }, [token]);

//   const handleJoin = useCallback((room: RoomSnapshot) => {
//     setJoinError(null);
//     if (room.stake === 0) {
//       doJoin(room);
//     } else {
//       setPendingRoom(room);
//     }
//   }, []); // eslint-disable-line

//   const doJoin = useCallback(async (room: RoomSnapshot) => {
//     if (!token) { setJoinError('Not authenticated. Please log in.'); return; }
//     setJoiningId(room.roomId);
//     setJoinError(null);
//     try {
//       const result = await apiJoinRoom(room.roomId, activeMode, token);

//       // Save session as single JSON object
//       sessionStorage.setItem('pool_game', JSON.stringify({
//         gameId:      result.gameId,
//         socketToken: result.socketToken,
//         roomId:      room.roomId,
//         mode:        activeMode,
//         stake:       room.stake,
//       }));

//       queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
//       router.push(`/pool/game/${room.roomId}`);
//     } catch (err: any) {
//       setJoinError(err.message ?? 'Failed to join room');
//       setPendingRoom(null);
//     } finally {
//       setJoiningId(null);
//     }
//   }, [activeMode, token, queryClient, router]);

//   const modeLabel = MODE_LABELS[activeMode] ?? activeMode;

//   if (authLoading) {
//     return (
//       <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
//         <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-400 animate-spin" />
//       </div>
//     );
//   }

//   if (!isAuthenticated) return null;

//   return (
//     <>
//       <Head><title>{modeLabel} Lobby · DashBets</title></Head>

//       <div className="min-h-screen bg-zinc-950" style={{ fontFamily: "'DM Sans', sans-serif" }}>
//         <div className="max-w-5xl mx-auto px-4 py-8">

//           {/* Back + title */}
//           <div className="flex items-center gap-3 mb-6">
//             <button onClick={() => router.push('/pool')}
//               className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm">
//               ← Back
//             </button>
//             <span className="text-zinc-700">|</span>
//             <h1 className="text-white font-black text-xl">{modeLabel}</h1>
//             <span className="text-zinc-600 text-sm">Choose a room</span>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//             {/* Left: rooms */}
//             <div className="lg:col-span-2">
//               {/* Mode tabs */}
//               <div className="flex gap-2 mb-5">
//                 {(['eightball', 'ethiopian'] as PoolMode[]).map(m => (
//                   <button key={m}
//                     onClick={() => { setActiveMode(m); router.push(`/pool/lobby/${m}`, undefined, { shallow: true }); }}
//                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
//                       activeMode === m
//                         ? 'bg-emerald-600 text-white'
//                         : 'bg-zinc-800 text-zinc-400 hover:text-white'
//                     }`}
//                   >
//                     {m === 'eightball' ? '🎱' : '🇪🇹'} {MODE_LABELS[m]}
//                   </button>
//                 ))}
//                 <div className="ml-auto flex items-center gap-1.5 text-zinc-600 text-xs">
//                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                   Live updates
//                 </div>
//               </div>

//               {/* Error */}
//               {joinError && (
//                 <div className="mb-4 bg-red-950/50 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
//                   ⚠️ {joinError}
//                 </div>
//               )}

//               {/* Room grid */}
//               {isLoading ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   {Array.from({ length: 5 }).map((_, i) => (
//                     <div key={i} className="h-40 bg-zinc-800/40 rounded-2xl animate-pulse" />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   {rooms.map(room => (
//                     <RoomCard
//                       key={room.roomId}
//                       room={room}
//                       userBalance={userBalance}
//                       onJoin={handleJoin}
//                       joining={joiningId === room.roomId}
//                     />
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Right: info sidebar */}
//             <div className="space-y-4">
//               {/* Balance */}
//               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
//                 <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Your Balance</div>
//                 <div className="text-white font-black text-2xl tabular-nums">{userBalance.toLocaleString()} ብር</div>
//                 <a href="/wallet/deposit"
//                   className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
//                   + Add Funds
//                 </a>
//               </div>

//               {/* How it works */}
//               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
//                 <div className="text-white font-semibold text-sm mb-4">How it works</div>
//                 <div className="space-y-3">
//                   {[
//                     { n: '1', title: 'Choose a room', desc: 'Select a room that matches your stake' },
//                     { n: '2', title: 'Join & Play',   desc: 'Join a room and wait for an opponent' },
//                     { n: '3', title: 'Win & Earn',    desc: 'Win the match and take the pot' },
//                   ].map(step => (
//                     <div key={step.n} className="flex items-start gap-3">
//                       <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">
//                         {step.n}
//                       </div>
//                       <div>
//                         <div className="text-white text-xs font-semibold">{step.title}</div>
//                         <div className="text-zinc-500 text-xs">{step.desc}</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Stakes legend */}
//               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
//                 <div className="text-white font-semibold text-sm mb-3">Room Stakes</div>
//                 <div className="space-y-2">
//                   {[
//                     { n: 'Room 1', s: 0,   color: '#6b7280' },
//                     { n: 'Room 2', s: 20,  color: '#34d399' },
//                     { n: 'Room 3', s: 20,  color: '#34d399' },
//                     { n: 'Room 4', s: 50,  color: '#60a5fa' },
//                     { n: 'Room 5', s: 100, color: '#f59e0b' },
//                   ].map(r => (
//                     <div key={r.n} className="flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
//                         <span className="text-zinc-400 text-xs">{r.n}</span>
//                       </div>
//                       <span className="text-zinc-300 text-xs font-semibold">
//                         {r.s === 0 ? '0 ብር' : `${r.s} ብር`}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="text-center text-zinc-600 text-xs">
//                 🛡 Fair Play · Secure · 18+ Only
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {pendingRoom && (
//         <StakeConfirmModal
//           room={pendingRoom}
//           joining={joiningId === pendingRoom.roomId}
//           onConfirm={() => doJoin(pendingRoom)}
//           onCancel={() => { setPendingRoom(null); setJoiningId(null); }}
//         />
//       )}
//     </>
//   );
// };

// export const getServerSideProps: GetServerSideProps = async ({ params }) => {
//   const mode = params?.mode as string;
//   if (!['eightball', 'ethiopian'].includes(mode)) {
//     return { redirect: { destination: '/pool', permanent: false } };
//   }
//   return { props: { mode } };
// };

// export default LobbyPage;