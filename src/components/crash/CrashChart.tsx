// components/crash/CrashChart.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MultiplierPoint, RoundStatus } from '../../hooks/useCrashGame';

interface CrashChartProps {
  status:     RoundStatus;
  multiplier: number;
  crashPoint: number | null;
  curve:      MultiplierPoint[];
  countdown:  number;
}

function multColor(m: number): string {
  if (m >= 50) return '#A855F7';
  if (m >= 10) return '#FFD700';
  if (m >= 2)  return '#00E5FF';
  return '#72FF3B';
}

function multGlow(m: number): string {
  if (m >= 50) return 'rgba(168,85,247,0.8)';
  if (m >= 10) return 'rgba(255,215,0,0.8)';
  if (m >= 2)  return 'rgba(0,229,255,0.8)';
  return 'rgba(114,255,59,0.8)';
}

// Draw a biohazard drone SVG at given position/angle using canvas
function drawBiohazardDrone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  glowColor: string,
  scale: number = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const s = ctx.shadowBlur;
  ctx.shadowBlur = 0;

  // ── Motion blur trail ──────────────────────────────────────────────
  for (let t = 1; t <= 5; t++) {
    const alpha = 0.04 + (5 - t) * 0.025;
    const dist  = t * 9;
    const r     = 10 + t * 3;
    const trailGrd = ctx.createRadialGradient(-dist, 0, 0, -dist, 0, r);
    trailGrd.addColorStop(0, `rgba(114,255,59,${alpha})`);
    trailGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = trailGrd;
    ctx.beginPath();
    ctx.ellipse(-dist, 0, r * 2, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Outer energy rings ─────────────────────────────────────────────
  for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    const ringR = 26 + r * 10;
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(114,255,59,${0.12 - r * 0.04})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Left rotor ────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(-24, -8);
  // Rotor disc
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,20,5,0.9)';
  ctx.fill();
  ctx.strokeStyle = '#72FF3B';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Inner glow core
  const leftGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
  leftGrd.addColorStop(0, '#72FF3B');
  leftGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = leftGrd;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Rotor blades (2 lines)
  ctx.strokeStyle = '#72FF3B';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Right rotor ───────────────────────────────────────────────────
  ctx.save();
  ctx.translate(24, -8);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,20,5,0.9)';
  ctx.fill();
  ctx.strokeStyle = '#72FF3B';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const rightGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
  rightGrd.addColorStop(0, '#72FF3B');
  rightGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = rightGrd;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#72FF3B';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Rotor arms ────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(114,255,59,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, 0);  ctx.lineTo(14, -8);  ctx.stroke();

  // ── Main drone body ───────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,15,2,0.95)';
  ctx.fill();
  ctx.strokeStyle = '#72FF3B';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Biohazard symbol on body ──────────────────────────────────────
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#72FF3B';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☣', 0, 0);
  ctx.globalAlpha = 1;

  // ── Reactor core (bottom glow) ────────────────────────────────────
  const coreGrd = ctx.createRadialGradient(0, 6, 0, 0, 6, 8);
  coreGrd.addColorStop(0, '#72FF3B');
  coreGrd.addColorStop(0.4, 'rgba(114,255,59,0.4)');
  coreGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrd;
  ctx.beginPath();
  ctx.arc(0, 6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function CrashChart({ status, multiplier, crashPoint, curve, countdown }: CrashChartProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [crashFlash, setCrashFlash]   = useState(false);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const animFrameRef = useRef<number>(0);

  // ── Crash effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'crashed') {
      setCrashFlash(true);
      const t1 = setTimeout(() => setCrashFlash(false), 800);

      // Particle burst
      if (canvasRef.current) {
        const W = canvasRef.current.clientWidth;
        const H = canvasRef.current.clientHeight;
        const cx = W * 0.7;
        const cy = H * 0.25;
        particlesRef.current = Array.from({ length: 40 }, () => ({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          life: 1,
          color: ['#FF4655', '#FF8800', '#FF4655', '#FFD700'][Math.floor(Math.random() * 4)],
        }));
      }

      // Shake
      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        if (shakeCount++ > 8) { clearInterval(shakeInterval); setShakeOffset({ x: 0, y: 0 }); return; }
        setShakeOffset({
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 4,
        });
      }, 50);

      return () => { clearTimeout(t1); clearInterval(shakeInterval); };
    }
  }, [status]);

  // ── ResizeObserver ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDims({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Main draw ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.w === 0 || dims.h === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width  = dims.w * dpr;
    canvas.height = dims.h * dpr;
    ctx.scale(dpr, dpr);

    const W = dims.w;
    const H = dims.h;

    // ── Deep background ───────────────────────────────────────────
    ctx.fillStyle = '#05070D';
    ctx.fillRect(0, 0, W, H);

    // Ambient toxic fog (bottom)
    const fogGrd = ctx.createLinearGradient(0, H * 0.6, 0, H);
    fogGrd.addColorStop(0, 'transparent');
    fogGrd.addColorStop(1, 'rgba(6,40,6,0.45)');
    ctx.fillStyle = fogGrd;
    ctx.fillRect(0, 0, W, H);

    // Green fog glow (bottom-left corner)
    const cornerGrd = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.55);
    cornerGrd.addColorStop(0, 'rgba(114,255,59,0.07)');
    cornerGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = cornerGrd;
    ctx.fillRect(0, 0, W, H);

    // ── Ruined city silhouette ────────────────────────────────────
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#72FF3B';
    // Buildings
    const buildings = [
      [0, H, 60, 80], [55, H, 40, 110], [90, H, 70, 65], [155, H, 30, 130],
      [W-200, H, 50, 90], [W-155, H, 80, 120], [W-80, H, 50, 100], [W-35, H, 40, 75],
    ];
    buildings.forEach(([bx, by, bw, bh]) => {
      ctx.fillRect(bx as number, (by as number) - (bh as number), bw as number, bh as number);
      // Broken windows
      for (let wr = 0; wr < 3; wr++) {
        for (let wc = 0; wc < 2; wc++) {
          if (Math.random() > 0.4) {
            ctx.fillRect(
              (bx as number) + 6 + wc * 16,
              (by as number) - (bh as number) + 10 + wr * 22,
              8, 8
            );
          }
        }
      }
    });

    // Zombie silhouettes (bottom edge)
    ctx.fillStyle = '#72FF3B';
    for (let z = 0; z < 8; z++) {
      const zx = (z * (W / 8)) + W / 16;
      const zy = H - 2;
      // Body
      ctx.fillRect(zx - 4, zy - 22, 8, 14);
      // Head
      ctx.beginPath(); ctx.arc(zx, zy - 28, 5, 0, Math.PI * 2); ctx.fill();
      // Outstretched arm
      ctx.fillRect(zx + 4, zy - 18, 14, 3);
    }
    ctx.globalAlpha = 1;

    // ── Starfield ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 137 + 41) % W);
      const sy = ((i * 97  + 23) % (H * 0.5));
      const sr = i % 4 === 0 ? 1.1 : 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Scanning line grid (subtle) ───────────────────────────────
    if (status === 'waiting' || status === 'idle') {
      const now = Date.now() / 1000;
      const scanY = ((now * 40) % H);
      const scanGrd = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrd.addColorStop(0, 'transparent');
      scanGrd.addColorStop(0.5, 'rgba(114,255,59,0.04)');
      scanGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Particles from crash burst ────────────────────────────────
    if (particlesRef.current.length > 0) {
      particlesRef.current = particlesRef.current
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 0.04 }))
        .filter((p) => p.life > 0);

      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    // ── Early return for idle/waiting ─────────────────────────────
    if ((status === 'waiting' || status === 'idle') || curve.length < 2) return;

    const padX      = 52;
    const padY      = 24;
    const padBottom = 36;
    const graphW    = W - padX - 20;
    const graphH    = H - padY - padBottom;

    const maxMult    = Math.max(...curve.map((p) => p.multiplier), multiplier, 1.5);
    const maxElapsed = Math.max(curve[curve.length - 1]?.elapsed ?? 1, 1);

    const toX = (e: number) => padX + (e / maxElapsed) * graphW;
    const toY = (m: number) => padY + graphH - ((m - 1) / Math.max(maxMult - 1, 0.5)) * graphH;

    const crashed  = status === 'crashed';
    const mc       = crashed ? '#FF4655' : multColor(multiplier);
    const mg       = crashed ? 'rgba(255,70,85,0.7)' : multGlow(multiplier);

    // ── Grid ──────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(114,255,59,0.05)';
    ctx.lineWidth   = 1;
    ctx.fillStyle   = 'rgba(114,255,59,0.25)';
    ctx.font        = `${Math.max(9, Math.min(11, Math.floor(W / 55)))}px 'Courier New', monospace`;
    ctx.textAlign   = 'right';
    ctx.textBaseline = 'middle';

    const gridStep = maxMult <= 2 ? 0.25 : maxMult <= 5 ? 0.5 : maxMult <= 15 ? 2 : maxMult <= 50 ? 10 : 25;
    for (let m = 1; m <= maxMult + gridStep * 2; m += gridStep) {
      const y = toY(m);
      if (y < padY - 4 || y > padY + graphH + 4) continue;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(W - 20, y);
      ctx.stroke();
      ctx.setLineDash([]);
      const label = m % 1 === 0 ? `${m.toFixed(0)}x` : `${m.toFixed(gridStep < 0.5 ? 2 : 1)}x`;
      ctx.fillText(label, padX - 6, y);
    }

    // ── Build path ────────────────────────────────────────────────
    const buildPath = () => {
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(1));
      for (let i = 0; i < curve.length; i++) {
        const cx2 = toX(curve[i].elapsed);
        const cy2 = toY(curve[i].multiplier);
        if (i === 0) {
          ctx.lineTo(cx2, cy2);
        } else {
          const prev = curve[i - 1];
          const cpX  = toX((prev.elapsed + curve[i].elapsed) / 2);
          ctx.bezierCurveTo(cpX, toY(prev.multiplier), cpX, cy2, cx2, cy2);
        }
      }
    };

    const lastPt = curve[curve.length - 1];

    // ── Gradient fill ─────────────────────────────────────────────
    buildPath();
    ctx.lineTo(toX(lastPt.elapsed), toY(1));
    ctx.lineTo(toX(0), toY(1));
    ctx.closePath();
    const fillGrd = ctx.createLinearGradient(0, padY, 0, padY + graphH);
    if (crashed) {
      fillGrd.addColorStop(0, 'rgba(255,70,85,0.22)');
    } else {
      const fillColors: Record<string, string> = {
        '#72FF3B': 'rgba(114,255,59,0.20)',
        '#00E5FF': 'rgba(0,229,255,0.16)',
        '#FFD700': 'rgba(255,215,0,0.16)',
        '#A855F7': 'rgba(168,85,247,0.16)',
      };
      fillGrd.addColorStop(0, fillColors[mc] ?? 'rgba(114,255,59,0.20)');
    }
    fillGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fillGrd;
    ctx.fill();

    // ── Outer glow stroke ─────────────────────────────────────────
    buildPath();
    ctx.strokeStyle = mg;
    ctx.lineWidth   = 12;
    ctx.lineJoin    = 'round';
    ctx.filter      = `blur(4px)`;
    ctx.stroke();
    ctx.filter      = 'none';

    // ── Core stroke ───────────────────────────────────────────────
    buildPath();
    ctx.strokeStyle = mc;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    const endX = toX(lastPt.elapsed);
    const endY = toY(lastPt.multiplier);

    // ── Glowing tip dot ───────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle   = mc;
    ctx.shadowColor = mg;
    ctx.shadowBlur  = 20;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // ── Biohazard drone (running only) ────────────────────────────
    if (status === 'running' && curve.length > 4) {
      const prev  = curve[Math.max(0, curve.length - 6)];
      const angle = Math.atan2(
        toY(lastPt.multiplier) - toY(prev.multiplier),
        toX(lastPt.elapsed)    - toX(prev.elapsed)
      );

      ctx.shadowColor = '#72FF3B';
      ctx.shadowBlur  = 24;
      drawBiohazardDrone(ctx, endX + 4, endY - 10, angle - 0.1, '#72FF3B', 1);
      ctx.shadowBlur  = 0;
    }

  }, [status, multiplier, crashPoint, curve, dims]);

  // ── Animation loop ────────────────────────────────────────────────
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  const mc   = multColor(multiplier);
  const mg   = multGlow(multiplier);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: '#05070D',
        transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
        transition: shakeOffset.x === 0 ? 'transform 0.1s' : 'none',
      }}
    >
      {/* Red crash flash */}
      {crashFlash && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: 'rgba(255,70,85,0.18)',
            borderRadius: 0,
          }}
        />
      )}

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Waiting / idle overlay ───────────────────────────────── */}
      {(status === 'waiting' || status === 'idle') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          {/* Rotating rings */}
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '1px solid rgba(114,255,59,0.2)',
                animation: 'spin 3s linear infinite',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: 10,
                border: '1px dashed rgba(114,255,59,0.15)',
                animation: 'spin 5s linear infinite reverse',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: 24,
                border: '2px solid rgba(114,255,59,0.3)',
                animation: 'spin 2s linear infinite',
              }}
            />

            {/* Biohazard icon */}
            <div
              style={{
                fontSize: 32,
                color: '#72FF3B',
                textShadow: '0 0 20px rgba(114,255,59,0.8)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            >
              ☣
            </div>
          </div>

          {status === 'waiting' && countdown > 0 ? (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: 'rgba(114,255,59,0.55)',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                OUTBREAK STARTING IN
              </div>
              <div
                style={{
                  fontSize: 'clamp(4rem,12vw,6.5rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: '#72FF3B',
                  textShadow: '0 0 40px rgba(114,255,59,0.9), 0 0 80px rgba(114,255,59,0.4)',
                  fontFamily: "'Courier New', monospace",
                  animation: 'countdown-pulse 1s ease-in-out infinite',
                }}
              >
                {countdown}s
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.2)',
                fontFamily: "'Courier New', monospace",
              }}
            >
              Awaiting outbreak…
            </div>
          )}
        </div>
      )}

      {/* ── Live multiplier ─────────────────────────────────────── */}
      {status === 'running' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            style={{
              fontSize: 'clamp(3.5rem,9vw,5.5rem)',
              fontWeight: 900,
              color: mc,
              textShadow: `0 0 30px ${mg}, 0 0 60px ${mg}`,
              fontFamily: "'Courier New', monospace",
              lineHeight: 1,
              transition: 'color 0.3s, text-shadow 0.3s',
              animation: 'multiplier-pulse 0.5s ease-in-out infinite alternate',
            }}
          >
            {multiplier.toFixed(2)}x
          </span>
        </div>
      )}

      {/* ── CRASHED overlay ─────────────────────────────────────── */}
      {status === 'crashed' && crashPoint !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="absolute inset-0" style={{ background: 'rgba(255,70,85,0.07)' }} />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: 'rgba(255,70,85,0.7)',
              fontFamily: "'Courier New', monospace",
              marginBottom: 8,
            }}
          >
            ☣ INFECTED ☣
          </div>
          <div
            style={{
              fontSize: 'clamp(3rem,9vw,5.5rem)',
              fontWeight: 900,
              color: '#FF4655',
              textShadow: '0 0 40px rgba(255,70,85,0.9), 0 0 80px rgba(255,70,85,0.4)',
              fontFamily: "'Courier New', monospace",
              lineHeight: 1,
              animation: 'crash-pulse 0.8s ease-in-out 3',
            }}
          >
            {crashPoint.toFixed(2)}x
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%,100% { text-shadow: 0 0 20px rgba(114,255,59,0.8); }
          50%      { text-shadow: 0 0 40px rgba(114,255,59,1), 0 0 60px rgba(114,255,59,0.6); }
        }
        @keyframes countdown-pulse {
          0%,100% { transform: scale(1); text-shadow: 0 0 40px rgba(114,255,59,0.9); }
          50%      { transform: scale(1.04); text-shadow: 0 0 60px rgba(114,255,59,1), 0 0 100px rgba(114,255,59,0.5); }
        }
        @keyframes multiplier-pulse {
          from { filter: brightness(1); }
          to   { filter: brightness(1.15); }
        }
        @keyframes crash-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}