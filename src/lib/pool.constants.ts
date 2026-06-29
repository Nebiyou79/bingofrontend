// /**
//  * lib/pool.constants.ts
//  * DashBets — Pool platform constants.
//  *
//  * Values must match pool.physics.js on the server exactly:
//  *   encodeSnapshot writes 7 Int16LE fields per ball:
//  *     id, x*1000, y*1000, z*1000, rx*100, ry*100, rz*100
//  *
//  * SNAPSHOT_FIELDS = 7
//  * SNAPSHOT_BYTES  = 2  (Int16 = 2 bytes)
//  * SNAPSHOT_POS_SCALE = 1000  (x/y/z divided by 1000 to recover metres)
//  * SNAPSHOT_ROT_SCALE = 100   (rx/ry/rz divided by 100 to recover radians)
//  */

// export const SOCKET_NAMESPACE = '/pool';

// // Binary snapshot format (matches pool.physics.js encodeSnapshot)
// export const SNAPSHOT_FIELDS    = 7;    // fields per ball record
// export const SNAPSHOT_BYTES     = 2;    // bytes per field (Int16LE)
// export const SNAPSHOT_POS_SCALE = 1000; // position encoding multiplier
// export const SNAPSHOT_ROT_SCALE = 100;  // rotation encoding multiplier
// export const BYTES_PER_BALL     = SNAPSHOT_FIELDS * SNAPSHOT_BYTES; // 14

// // Table geometry (metres) — mirrors pool.physics.js
// export const TABLE_HX     = 1.065;
// export const TABLE_HZ     = 0.535;
// export const BALL_RADIUS  = 0.028;

// // Pocket positions [x, z] — 6 pockets
// export const POCKET_POSITIONS: [number, number][] = [
//   [-TABLE_HX,  TABLE_HZ],   // top-left
//   [ 0,         TABLE_HZ],   // top-centre
//   [ TABLE_HX,  TABLE_HZ],   // top-right
//   [-TABLE_HX, -TABLE_HZ],   // bottom-left
//   [ 0,        -TABLE_HZ],   // bottom-centre
//   [ TABLE_HX, -TABLE_HZ],   // bottom-right
// ];

// // Rack positions [x, z] — mirrors RACK_POSITIONS in pool.physics.js
// export const RACK_POSITIONS: Record<number, [number, number]> = {
//   0:  [-0.65,  0.000],
//   1:  [ 0.550, 0.000],
//   2:  [ 0.606, -0.029],
//   3:  [ 0.606,  0.029],
//   4:  [ 0.662, -0.058],
//   5:  [ 0.662,  0.000],
//   6:  [ 0.662,  0.058],
//   7:  [ 0.718, -0.087],
//   8:  [ 0.718, -0.029],
//   9:  [ 0.718,  0.029],
//   10: [ 0.718,  0.087],
//   11: [ 0.774, -0.116],
//   12: [ 0.774, -0.058],
//   13: [ 0.774,  0.000],
//   14: [ 0.774,  0.058],
//   15: [ 0.774,  0.116],
// };

// // Ball Y rest position (ball centre height above table surface)
// export const BALL_REST_Y = 0.028; // = BALL_RADIUS

// // Stakes and house cuts — mirrors ROOM_CONFIGS in poolController.js
// export const ROOM_CONFIGS = [
//   { roomNumber: 1, type: 'cpu' as const,  stake: 0,   houseCut: 0,  winnerPayout: 0   },
//   { roomNumber: 2, type: 'pvp' as const,  stake: 20,  houseCut: 5,  winnerPayout: 35  },
//   { roomNumber: 3, type: 'pvp' as const,  stake: 20,  houseCut: 5,  winnerPayout: 35  },
//   { roomNumber: 4, type: 'pvp' as const,  stake: 50,  houseCut: 10, winnerPayout: 90  },
//   { roomNumber: 5, type: 'pvp' as const,  stake: 100, houseCut: 20, winnerPayout: 180 },
// ];



// // Solid ball numbers (1-7), stripe ball numbers (9-15)
// export const SOLID_BALLS  = [1, 2, 3, 4, 5, 6, 7];
// export const STRIPE_BALLS = [9, 10, 11, 12, 13, 14, 15];
// export const EIGHT_BALL   = 8;
// export const CUE_BALL     = 0;

// // Ethiopian: ball sequence 3 → 15
// export const ETHIOPIAN_BALLS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// // Standard pool ball colors (for canvas texture generation)
// export const BALL_COLORS: Record<number, string> = {
//   0:  '#FFFFFF', // cue
//   1:  '#F5C518', // solid yellow
//   2:  '#1565C0', // solid blue
//   3:  '#E53935', // solid red
//   4:  '#7B1FA2', // solid purple
//   5:  '#E65100', // solid orange
//   6:  '#2E7D32', // solid green
//   7:  '#8B1A1A', // solid maroon
//   8:  '#111111', // eight ball
//   9:  '#F5C518', // stripe yellow
//   10: '#1565C0', // stripe blue
//   11: '#E53935', // stripe red
//   12: '#7B1FA2', // stripe purple
//   13: '#E65100', // stripe orange
//   14: '#2E7D32', // stripe green
//   15: '#8B1A1A', // stripe maroon
// };
// lib/pool.constants.js
// Mirrors server-side ROOM_CONFIGS exactly. Single source of truth for UI.

export const POOL_MODES = ['eightball', 'ethiopian'];

export const MODE_LABELS = {
  eightball: '8-Ball',
  ethiopian: 'Ethiopian Points',
};

export const ROOM_CONFIGS = [
  { roomNumber: 1, type: 'cpu',  stake: 0,   houseCut: 0,  winnerPayout: 0,   maxPlayers: 1 },
  { roomNumber: 2, type: 'pvp',  stake: 20,  houseCut: 5,  winnerPayout: 35,  maxPlayers: 2 },
  { roomNumber: 3, type: 'pvp',  stake: 20,  houseCut: 5,  winnerPayout: 35,  maxPlayers: 2 },
  { roomNumber: 4, type: 'pvp',  stake: 50,  houseCut: 10, winnerPayout: 90,  maxPlayers: 2 },
  { roomNumber: 5, type: 'pvp',  stake: 100, houseCut: 20, winnerPayout: 180, maxPlayers: 2 },
];

// Ball numbers by group (8-Ball mode)
export const SOLID_BALLS   = [1, 2, 3, 4, 5, 6, 7];
export const STRIPE_BALLS  = [9, 10, 11, 12, 13, 14, 15];
export const EIGHT_BALL    = 8;
// Reconnect grace period in seconds (matches DISCONNECT_GRACE_MS / 1000 in pool.socket.js)
export const RECONNECT_GRACE_SECS = 30;

// localStorage / sessionStorage keys
export const TOKEN_KEY        = 'token';           // JWT — existing app convention
export const POOL_SESSION_KEY = 'pool_game';       // PoolSessionData JSON
// Ethiopian object balls in sequence
export const ETHIOPIAN_BALLS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Ball colours (for texture-less fallback / HUD icons)
export const BALL_COLORS = {
  0:  '#F5F5F0', // cue
  1:  '#F5C518', // solid yellow
  2:  '#1A52BD', // solid blue
  3:  '#D62020', // solid red
  4:  '#6B2FA0', // solid purple
  5:  '#E8792A', // solid orange
  6:  '#1A8A1A', // solid green
  7:  '#8B1A1A', // solid maroon
  8:  '#111111', // eight ball
  9:  '#F5C518', // stripe yellow
  10: '#1A52BD', // stripe blue
  11: '#D62020', // stripe red
  12: '#6B2FA0', // stripe purple
  13: '#E8792A', // stripe orange
  14: '#1A8A1A', // stripe green
  15: '#8B1A1A', // stripe maroon
};

// Physics unit → Three.js scale (physics uses metres, Three.js scene uses same)
export const BALL_RADIUS   = 0.028;
export const TABLE_HX      = 1.065;
export const TABLE_HZ      = 0.535;
export const CUSHION_H     = 0.05;
export const POCKET_RADIUS = 0.060;

// Pocket positions matching server exactly [X, Z]
export const POCKET_POSITIONS = [
  [-TABLE_HX,  TABLE_HZ],
  [ 0,         TABLE_HZ],
  [ TABLE_HX,  TABLE_HZ],
  [-TABLE_HX, -TABLE_HZ],
  [ 0,        -TABLE_HZ],
  [ TABLE_HX, -TABLE_HZ],
];
// Add after the POCKET_POSITIONS export:

// Rack positions [x, z] — mirrors RACK_POSITIONS in pool.physics.js
export const RACK_POSITIONS = {
  0:  [-0.65,  0.000],
  1:  [ 0.550, 0.000],
  2:  [ 0.606, -0.029],
  3:  [ 0.606,  0.029],
  4:  [ 0.662, -0.058],
  5:  [ 0.662,  0.000],
  6:  [ 0.662,  0.058],
  7:  [ 0.718, -0.087],
  8:  [ 0.718, -0.029],
  9:  [ 0.718,  0.029],
  10: [ 0.718,  0.087],
  11: [ 0.774, -0.116],
  12: [ 0.774, -0.058],
  13: [ 0.774,  0.000],
  14: [ 0.774,  0.058],
  15: [ 0.774,  0.116],
};

// Ball Y rest position (ball centre height above table surface)
export const BALL_REST_Y = 0.028; // = BALL_RADIUS
// Binary snapshot decode constants (must match pool.physics.js encodeSnapshot)
export const SNAPSHOT_FIELDS     = 7;    // id, x, y, z, rx, ry, rz
export const SNAPSHOT_BYTES      = 2;    // Int16LE
export const SNAPSHOT_POS_SCALE  = 1000; // x/y/z stored as int × 1000
export const SNAPSHOT_ROT_SCALE  = 100;  // rx/ry/rz stored as int × 100

export const SOCKET_NAMESPACE = '/pool';
export const API_BASE         = '/api/pool';