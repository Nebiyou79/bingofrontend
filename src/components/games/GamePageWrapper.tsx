/**
 * components/games/GamePageWrapper.tsx
 * Premium game loading experience with themed background and progress
 * Each game gets its own background image from config
 */

import React, { useEffect, useState } from 'react';
import { AppLayout } from '../layout/AppLayout';
import { LoadingScreen } from '../LoadingScreen';
import { GameConfig } from '../../config/gameConfig';

interface GamePageWrapperProps {
  game: GameConfig;
  children: React.ReactNode;
  loadingDuration?: number; // in ms, default 2000
}

export function GamePageWrapper({ game, children, loadingDuration = 2000 }: GamePageWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);

  // Preload game-specific background image
  useEffect(() => {
    if (game.backgroundImage) {
      const img = new window.Image();
      img.onload = () => {
        setBgLoaded(true);
        setBgError(false);
      };
      img.onerror = () => {
        console.warn(`Failed to load background image: ${game.backgroundImage}`);
        setBgError(true);
        setBgLoaded(true); // Continue loading even if bg fails
      };
      img.src = game.backgroundImage;
    } else {
      setBgLoaded(true);
    }
  }, [game.backgroundImage]);

  // Loading progress animation
  useEffect(() => {
    const startTime = Date.now();
    let animationFrame: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = (elapsed / loadingDuration) * 100;
      
      // Ease out cubic for smooth finish
      const easedProgress = Math.min(100, rawProgress * (1 - Math.pow(1 - rawProgress / 100, 3)));
      
      setProgress(Math.floor(easedProgress));

      if (elapsed < loadingDuration) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        // Short delay before showing content
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setIsLoading(false), 300);
        }, 200);
      }
    };

    // Only start loading animation after background is loaded (or failed)
    if (bgLoaded) {
      animationFrame = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [loadingDuration, bgLoaded]);

  return (
    <AppLayout title={game.name}>
      {/* Game-Specific Background Image with parallax effect */}
      {game.backgroundImage && bgLoaded && !bgError && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${game.backgroundImage})`,
              opacity: 0.15,
              filter: 'blur(8px)',
              transform: 'scale(1.05)',
            }}
          />
          {/* Game-specific colored overlays */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${game.accentColor}20 0%, transparent 60%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${game.secondaryColor}15 0%, transparent 60%)`,
            }}
          />
        </div>
      )}

      {/* Fallback gradient if no background image */}
      {(!game.backgroundImage || bgError) && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${game.accentColor}10 0%, ${game.secondaryColor}08 50%, #080b18 100%)`,
            }}
          />
        </div>
      )}

      {/* Loading Screen — themed and imaged for this specific game */}
      {isVisible && (
        <LoadingScreen
          isVisible={isVisible}
          progress={progress}
          message={game.description || `Loading ${game.name}...`}
          gameName={game.name}
          loadingImage={game.loadingImage}
          accentColor={game.accentColor}
          secondaryColor={game.secondaryColor}
        />
      )}

      {/* Game Content with fade in */}
      <div
        className="relative z-10 transition-all duration-500"
        style={{
          opacity: isLoading ? 0 : 1,
          transform: isLoading ? 'translateY(10px)' : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </AppLayout>
  );
}