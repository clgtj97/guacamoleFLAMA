// hooks/useWalkingAnimation.ts
// ─────────────────────────────────────────────────────────────────────────────
// REWRITE: fully RAF-based, zero setInterval, zero React state for currentFrame.
//
// WHY the old version broke:
//   - setInterval(75ms) fighting a 60fps RAF loop caused Chrome to restart the
//     interval on every render (the useEffect([currentAnimation]) dependency).
//   - playAnimation() had an early-exit "already playing" guard, so calling it
//     every RAF tick meant the interval never got a clean start → frame stuck at 0.
//   - setCurrentFrame → React re-render → new interval → frame resets → loop.
//
// NEW APPROACH:
//   - A single RAF loop owns ALL frame timing. No setInterval anywhere.
//   - currentFrame is a ref mutated in the loop; the ONLY React state update is
//     `setRenderTick` (a cheap counter) which tells React "repaint this frame".
//   - playAnimation / playStopAnimation just flip refs — no setState, no guards
//     based on stale state. The RAF loop reads them fresh every tick.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';

interface AnimationDef {
  row: number;
  frames: number;
  frameDuration: number; // ms per frame
  loop: boolean;
}

interface SpriteConfig {
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, AnimationDef>;
}

const useWalkingAnimation = (spriteConfig: SpriteConfig) => {
  // The only React state — a cheap counter just to trigger a re-render each frame.
  // We never read its value; we only call setRenderTick to schedule a repaint.
  const [, setRenderTick] = useState(0);

  // All real state lives in refs so the RAF loop never needs to close over
  // stale React state values.
  const currentAnimRef  = useRef<string>('idle');
  const currentFrameRef = useRef<number>(0);
  const frameElapsedRef = useRef<number>(0); // ms accumulated in this frame slot
  const isStoppingRef   = useRef<boolean>(false);
  const stopTimerRef    = useRef<number | null>(null);
  const rafRef          = useRef<number | null>(null);
  const lastTimeRef     = useRef<number | null>(null);

  // ── helpers ───────────────────────────────────────────────────────────────

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  // ── RAF tick ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 50); // cap at 50ms
      lastTimeRef.current = timestamp;

      const anim = currentAnimRef.current;
      const cfg  = spriteConfig?.animations?.[anim];

      if (cfg && anim !== 'idle') {
        frameElapsedRef.current += dt;

        if (frameElapsedRef.current >= cfg.frameDuration) {
          frameElapsedRef.current -= cfg.frameDuration;

          if (anim === 'walk') {
            if (isStoppingRef.current) {
              // Stop frames: 10 → 11, then hold at 11
              if (currentFrameRef.current < 10) {
                currentFrameRef.current = 10;
              } else if (currentFrameRef.current < 11) {
                currentFrameRef.current += 1;
              }
              // hold at 11 — the setTimeout in playStopAnimation will switch to idle
            } else {
              // Walk cycle: frames 1–9 looping
              let next = currentFrameRef.current + 1;
              if (next > 9 || next < 1) next = 1;
              currentFrameRef.current = next;
            }
          }

          // Tell React to repaint (cheap — just flips an integer)
          setRenderTick(t => t + 1);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [spriteConfig]); // only re-mounts if spriteConfig changes (never in practice)

  // ── public API ────────────────────────────────────────────────────────────

  const playAnimation = useCallback((animation: string) => {
    if (!spriteConfig?.animations?.[animation]) return;
    // Skip only if we're already in this animation AND not in a stop sequence
    if (currentAnimRef.current === animation && !isStoppingRef.current) return;

    clearStopTimer();
    isStoppingRef.current = false;

    if (animation === 'walk') {
      // Don't reset frame if we're already mid-walk (prevents jumping to frame 0)
      if (currentAnimRef.current !== 'walk') {
        currentFrameRef.current = 1;
        frameElapsedRef.current = 0;
      }
    } else if (animation === 'idle') {
      currentFrameRef.current = 0;
      frameElapsedRef.current = 0;
    }

    currentAnimRef.current = animation;
    setRenderTick(t => t + 1); // immediate repaint
  }, [spriteConfig, clearStopTimer]);

  const playStopAnimation = useCallback(() => {
    const walkCfg = spriteConfig?.animations?.walk;
    if (!walkCfg) return;
    if (currentAnimRef.current !== 'walk' || isStoppingRef.current) return;

    isStoppingRef.current = true;
    currentFrameRef.current = 10;
    frameElapsedRef.current = 0;
    setRenderTick(t => t + 1);

    clearStopTimer();
    stopTimerRef.current = window.setTimeout(() => {
      isStoppingRef.current = false;
      currentAnimRef.current = 'idle';
      currentFrameRef.current = 0;
      frameElapsedRef.current = 0;
      setRenderTick(t => t + 1);
    }, walkCfg.frameDuration * 3);
  }, [spriteConfig, clearStopTimer]);

  // ── cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearStopTimer();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [clearStopTimer]);

  // Expose refs as plain values — callers read currentFrame directly from the ref
  return {
    currentAnimation: currentAnimRef.current,
    currentFrame: currentFrameRef.current,
    playAnimation,
    playStopAnimation,
  };
};

export default useWalkingAnimation;