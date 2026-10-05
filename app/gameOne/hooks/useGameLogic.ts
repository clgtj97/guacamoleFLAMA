// hooks/useGameLogic.ts — COMPLETE WITH VERTICAL WALKING + SMOOTH MOVEMENT
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGameLogicProps {
  spriteConfig: any;
  roomConfig: any[];
  isMobile: boolean;
  spriteVisualWidth?: number;
}



export function useGameLogic({ spriteConfig, roomConfig, isMobile, spriteVisualWidth }: UseGameLogicProps) {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [verticalPosition, setVerticalPosition] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [keysPressed, setKeysPressed] = useState({ left: false, right: false, up: false, down: false });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [gameEvent, setGameEvent] = useState<string>('exploring');
  const [gameSize, setGameSize] = useState({
    width: isMobile ? 400 : 1280,
    height: isMobile ? 300 : 720
  });
  const [lastTransitionDirection, setLastTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [nextRoomIndex, setNextRoomIndex] = useState<number | null>(null);
  const [forcedIdle, setForcedIdle] = useState(false);
  const [showRacerApp, setShowRacerApp] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [gameDoorCooldown, setGameDoorCooldown] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const externalDoorZonesRef = useRef<any>(null);
  const positionRef = useRef(0);
  const verticalPositionRef = useRef(0);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keep refs in sync so movement callbacks always read fresh values
  positionRef.current = position;
  verticalPositionRef.current = verticalPosition;

  const currentRoom = roomConfig[currentRoomIndex];
  const isFirstRoom = currentRoomIndex === 0;
  const isLastRoom = currentRoomIndex === roomConfig.length - 1;
  const hasGameDoor = currentRoom?.hasGameDoor;

  const spriteVisualW = spriteVisualWidth || (
    spriteConfig?.frameWidth && spriteConfig?.displayScale
      ? Math.round(spriteConfig.frameWidth * spriteConfig.displayScale)
      : 64
  );

  

  const halfW = spriteVisualW / 2;

  const getRoomConfig = useCallback(() => {
    const ez = externalDoorZonesRef.current;
    const doorWidth = Math.round(spriteVisualW * 0.30);

    const leftZoneStart = 0;
    const leftZoneEnd = ez ? ez.left.end : doorWidth;
    const rightZoneStart = ez ? ez.right.start : gameSize.width - doorWidth;
    const rightZoneEnd = ez ? ez.right.end : gameSize.width;
    const gameZoneStart = ez?.game ? ez.game.start : Math.round(gameSize.width * 0.64);
    const gameZoneEnd = ez?.game ? ez.game.end : Math.round(gameSize.width * 0.77);

    const minX = 0;
    const maxX = gameSize.width;

    const leftSpawnPosition = leftZoneEnd + halfW + 8;
    const rightSpawnPosition = rightZoneStart - halfW - 8;
    const gameExitPosition = gameZoneStart + (gameZoneEnd - gameZoneStart) / 2;

    // Vertical range — walkingLineMin/Max are PERCENTAGES of canvas height (0–100).
    const vertMinPct = currentRoom?.walkingLineMin ?? 0;
  const vertMaxPct = currentRoom?.walkingLineMax ?? 15; // Keep at 15, not 25
      const vertMin = Math.round((vertMinPct / 100) * gameSize.height);
  const vertMax = Math.round((vertMaxPct / 100) * gameSize.height);

    const config: any = {
      leftExit: { x: leftZoneStart, width: doorWidth, threshold: halfW, enabled: !isFirstRoom },
      rightExit: { x: rightZoneStart, width: doorWidth, threshold: halfW, enabled: !isLastRoom },
      boundaries: { minX, maxX },
      spawnPositions: { left: leftSpawnPosition, right: rightSpawnPosition },
      verticalRange: { min: vertMin, max: vertMax },
      doorZones: {
        left: { start: leftZoneStart, end: leftZoneEnd },
        right: { start: rightZoneStart, end: rightZoneEnd },
      },
    };

    if (hasGameDoor) {
      config.gameExit = { x: gameExitPosition, width: doorWidth, threshold: halfW, enabled: true };
      config.doorZones.game = { start: gameZoneStart, end: gameZoneEnd };
    }

    return config;
  }, [gameSize.width, gameSize.height, isFirstRoom, isLastRoom, hasGameDoor, spriteVisualW, halfW, currentRoom]);

  const startRoomTransition = useCallback((transitionDirection: 'left' | 'right', targetRoomIndex: number) => {
    setIsTransitioning(true);
    setForcedIdle(true);
    setKeysPressed({ left: false, right: false, up: false, down: false });
    setShowGamePrompt(false);
    setTransitionProgress(0);
    setLastTransitionDirection(transitionDirection);
    setNextRoomIndex(targetRoomIndex);

    const transitionDuration = 800;
    const startTime = performance.now();

    const animateTransition = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      setTransitionProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        setIsTransitioning(false);
        setForcedIdle(false);
        setTransitionProgress(0);
        setCurrentRoomIndex(targetRoomIndex);
        setNextRoomIndex(null);
        setGameDoorCooldown(false);

        const cfg = getRoomConfig();
        const newPos = transitionDirection === 'right' ? cfg.spawnPositions.left : cfg.spawnPositions.right;
        setPosition(newPos);
        setVerticalPosition(cfg.verticalRange.min);
      }
    };

    requestAnimationFrame(animateTransition);
  }, [getRoomConfig]);

  const handleGameDoorApproach = useCallback(() => {
    if (!gameDoorCooldown && !showGamePrompt) {
      setShowGamePrompt(true);
      setGameEvent('game_door_activated');
      setGameDoorCooldown(true);
      setTimeout(() => setGameDoorCooldown(false), 1500);
    }
  }, [gameDoorCooldown, showGamePrompt]);

  const openRacerApp = useCallback(() => {
    setIsTransitioning(true);
    setForcedIdle(true);
    setKeysPressed({ left: false, right: false, up: false, down: false });

    const transitionDuration = 800;
    const startTime = performance.now();

    const animateTransition = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      setTransitionProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        setIsTransitioning(false);
        setShowRacerApp(true);
        setShowGamePrompt(false);
      }
    };

    requestAnimationFrame(animateTransition);
  }, []);

  const closeRacerApp = useCallback(() => {
    setShowRacerApp(false);
    setForcedIdle(false);
  }, []);

  const handleContinueWalking = useCallback(() => {
    setShowGamePrompt(false);
  }, []);

  

 // In useGameLogic.ts, update the handleMovement function
// Find the game door check and add vertical position requirement:

// ── HORIZONTAL MOVEMENT ──
const handleMovement = useCallback((moveDirection: 'left' | 'right', deltaTime: number) => {
  if (isTransitioning || showRacerApp) return;

  const SPEED = 12;
  const move = moveDirection === 'right' ? SPEED * deltaTime : -SPEED * deltaTime;

  const roomCfg = getRoomConfig();
  let newPos = positionRef.current + move;

  // Clamp to canvas
  if (newPos < 0) newPos = 0;
  if (newPos > gameSize.width) newPos = gameSize.width;

  // Door checks
  const { leftExit, rightExit, gameExit, doorZones, verticalRange } = roomCfg;

  if (leftExit.enabled && newPos >= doorZones.left.start && newPos <= doorZones.left.end + halfW) {
    setGameEvent('returning_to_previous_room');
    setShowGamePrompt(false);
    startRoomTransition('left', currentRoomIndex - 1);
    return;
  }

  if (rightExit.enabled && newPos >= doorZones.right.start - halfW && newPos <= doorZones.right.end) {
    setGameEvent('entering_next_room');
    setShowGamePrompt(false);
    startRoomTransition('right', currentRoomIndex + 1);
    return;
  }

  // GAME DOOR: Only activate when player walks up to it (near blue line)
  // Check horizontal position AND vertical position (must be near the top of walking range)
 if (gameExit?.enabled && doorZones.game &&
    newPos >= doorZones.game.start && newPos <= doorZones.game.end &&
    !gameDoorCooldown && !showGamePrompt) {
  
  // Check vertical position - must be close to the blue line (top of walking range)
  const currentVert = verticalPositionRef.current;
  const vertMax = verticalRange?.max ?? 0;
  const vertThreshold = vertMax * 0.6; // Must be at least 60% of the way up
  
  if (currentVert >= vertThreshold) {
    setGameEvent('approaching_pista_game');
    handleGameDoorApproach();
  }
}

  setPosition(newPos);
}, [
  isTransitioning, showRacerApp, getRoomConfig,
  currentRoomIndex, startRoomTransition, handleGameDoorApproach,
  gameDoorCooldown, showGamePrompt, halfW, gameSize.width
]);

  // ── VERTICAL MOVEMENT ──
  const handleVerticalMovement = useCallback((moveDir: 'up' | 'down', deltaTime: number) => {
    if (isTransitioning || showRacerApp) return;

    const SPEED = 8; // Increased from 6 for better responsiveness
    const move = moveDir === 'up' ? SPEED * deltaTime : -SPEED * deltaTime;
    const roomCfg = getRoomConfig();
    let newVert = verticalPositionRef.current + move;

    if (newVert < roomCfg.verticalRange.min) newVert = roomCfg.verticalRange.min;
    if (newVert > roomCfg.verticalRange.max) newVert = roomCfg.verticalRange.max;

    setVerticalPosition(newVert);
  }, [isTransitioning, showRacerApp, getRoomConfig]);

  const stopMovement = useCallback(() => {
    setKeysPressed({ left: false, right: false, up: false, down: false });
  }, []);
// NOTE: Movement loop intentionally removed from this hook.
// The single authoritative RAF loop lives in GameOneWeb.tsx and calls
// handleMovement / handleVerticalMovement directly. Having a second loop
// here caused double-updates every frame → choppy animation on Chrome
// and stale-closure position drift across all browsers.

  // Set initial vertical position to the floor (min) so sprite starts standing on it
  useEffect(() => {
    const cfg = getRoomConfig();
    setVerticalPosition(cfg.verticalRange.min);
  }, [currentRoomIndex, getRoomConfig]);

  // Spawn position after room transition
  useEffect(() => {
    if (nextRoomIndex === null) return;
    const roomCfg = getRoomConfig();

    if (lastTransitionDirection === 'right') {
      setPosition(roomCfg.spawnPositions.left);
      setDirection('right');
    } else if (lastTransitionDirection === 'left') {
      setPosition(roomCfg.spawnPositions.right);
      setDirection('left');
    }
  }, [nextRoomIndex, getRoomConfig, lastTransitionDirection]);

  useEffect(() => {
    if (showGamePrompt) {
      const timeout = setTimeout(() => setShowGamePrompt(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showGamePrompt]);



  return {
    currentRoomIndex,
    position,
    verticalPosition,
    direction,
    keysPressed,
    isTransitioning,
    transitionProgress,
    gameEvent,
    gameSize,
    lastTransitionDirection,
    nextRoomIndex,
    forcedIdle,
    showRacerApp,
    showGamePrompt,
    currentRoom,
    roomConfig: getRoomConfig(),
    setDirection,
    setKeysPressed,
    setGameSize,
    handleMovement,
    handleVerticalMovement,
    stopMovement,
    startRoomTransition,
    openRacerApp,
    closeRacerApp,
    setShowRacerApp,
    setShowGamePrompt,
    handleContinueWalking,
    setDoorZones: (zones: any) => { externalDoorZonesRef.current = zones; },
    spriteConfig
  };
}