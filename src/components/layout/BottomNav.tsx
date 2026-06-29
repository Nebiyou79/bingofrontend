/**
 * components/layout/BottomNav.tsx
 * DashBets — 5-tab bottom navigation bar with center bonus button.
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const tabs = [
  { label: 'HOME',        icon: '🏠', href: '/dashboard'    },
  { label: 'WALLET',      icon: '💰', href: '/wallet'       },
  { label: 'BONUS',       icon: '🎁', href: '/bonus', center: true },
  { label: 'CONTACT',     icon: '💬', href: '/support'      },
  { label: 'LEADERBOARD', icon: '🏆', href: '/leaderboard'  },
] as const;

export function BottomNav() {
  const router  = useRouter();
  const current = router.pathname;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-white/5"
      style={{
        fontFamily: "'Exo 2', sans-serif",
        background: 'rgba(10,8,20,0.98)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = current === tab.href || current.startsWith(tab.href + '/');

          if ((tab as { center?: boolean }).center) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-col items-center -mt-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 border-[#0f0c1a]"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: '0 0 20px rgba(245,158,11,0.5)',
                  }}
                >
                  {tab.icon}
                </div>
                <span className="text-[9px] font-bold text-amber-400 mt-0.5 uppercase tracking-wide">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href}>
              <div className="flex flex-col items-center gap-0.5 pb-1 pt-2 min-w-[2.5rem]">
                <span
                  className={`text-xl transition-transform ${
                    isActive ? 'scale-110' : 'opacity-50'
                  }`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide ${
                    isActive ? 'text-purple-400' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}