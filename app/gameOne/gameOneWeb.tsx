// GameOneWeb.tsx – COMPLETE PRODUCTION DASHBOARD EDITION (vertical walking + tight spacing)
import React, { useState, useEffect, useRef } from 'react';
import spriteSheet from './assets/sprite-sheet-3.png';
import backgroundImage from './assets/ferrariRoom.jpg';
import insideBackground from './assets/ferrariRoomDos.jpg';
import loungeRoom from './assets/ferrariRoomTres.png';
import AlaPistaRoom from './assets/ferrariRoomCuatro.png';
import vegaRoom from './assets/ferrariRoomCinco.png';
import useWalkingAnimation from './hooks/useWalkingAnimation';
import GameAd from './components/GameAd';
import VirtualChat from './components/VirtualChat';
import RacerApp from './RacerApp';
import ColosseumGame from './ColosseumGame';
import { useGameLogic } from './hooks/useGameLogic';
import { useFerrariMultiplayer } from './hooks/useFerrariMultiplayer';
import GameOneMobile from './gameOneMobile';
import {
  MessageSquare, ChevronDown, ChevronUp, Pin, PinOff,
  PanelLeftClose, PanelRightClose, Users, Gauge, Wifi, ArrowUpRight,
  Car, Trophy, Gem, ShoppingBag, Bitcoin, Flag, X
} from 'lucide-react';

import BebasNeueTTF from './assets/Bebas_Neue/BebasNeue-Regular.ttf';
import SixtyfourTTF from './assets/Sixtyfour/Sixtyfour-Regular-VariableFont_BLED,SCAN.ttf';
import ZalandoSansTTF from './assets/Zalando_Sans_SemiExpanded/ZalandoSansSemiExpanded-VariableFont_wght.ttf';

import gameAddOne from './assets/ferrariAddOne.png';
import gameAddTwo from './assets/ferrariAddDos.png';

const FERRARI_MODERN_URL = 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=500&fit=crop&auto=format';
const FERRARI_LUXURY_URL = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=500&fit=crop&auto=format';

// ──────────────────────────────────────────────
// SPRITE & DOOR CONFIG
// ──────────────────────────────────────────────
const SPRITE_CONFIG = {
  frameWidth: 258,
  frameHeight: 256,
  displayScale: 0.405,
  animations: {
    walk: { 
      row: 2, 
      frames: 10,
      frameDuration: 75,
      loop: true 
    },
    idle: { 
      row: 0, 
      frames: 1, 
      frameDuration: 280,     
      loop: true 
    },
  },
};

// Fraction of rendered frame height that is transparent dead-space at the bottom.
// Increase SPRITE_FOOT_TRIM_RATIO if feet still float; decrease if head is clipped.

const SPRITE_VISUAL_W = Math.round(
  SPRITE_CONFIG.frameWidth * SPRITE_CONFIG.displayScale
);

const SPRITE_VISUAL_H = Math.round(
  SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.displayScale
);

const SPRITE_FOOT_TRIM_RATIO = 0.08;

const SPRITE_FOOT_TRIM = Math.round(
  SPRITE_CONFIG.frameHeight *
  SPRITE_CONFIG.displayScale *
  SPRITE_FOOT_TRIM_RATIO
);

function makeDoorZones(canvasWidth: number) {
  const doorWidth = Math.round(SPRITE_VISUAL_W * 0.30);
  return {
    left: { start: 0, end: doorWidth },
    right: { start: canvasWidth - doorWidth, end: canvasWidth },
    game: { start: Math.round(canvasWidth * 0.64), end: Math.round(canvasWidth * 0.77) },
  };
}

const DOOR_ZONES = makeDoorZones(1280);

// ──────────────────────────────────────────────
// ROOM CONFIGURATION – now with vertical walking range
// ──────────────────────────────────────────────
// walkingLineMin/Max are PERCENTAGES of the canvas height (0 = bottom, 100 = top).
// walkingLineMin = where the floor/door-bottom sits (red line).
// walkingLineMax = how far up into the room the player can walk (blue line).
// Tune walkingLineMin per room to match the visible floor line of each background.
const ROOM_CONFIG = [
  {
    id: 'outside',
    name: 'Ferrari Showroom Entrance',
    background: backgroundImage,
    walkingLineMin: 0,
    walkingLineMax: 5,
    doorZones: { left: DOOR_ZONES.left, right: DOOR_ZONES.right },
  },
  {
    id: 'inside',
    name: 'Ferrari Showroom Interior',
    background: insideBackground,
    walkingLineMin: 0,
    walkingLineMax: 5,
    doorZones: { left: DOOR_ZONES.left, right: DOOR_ZONES.right },
  },
  {
    id: 'lounge',
    name: 'Ferrari VIP Lounge',
    background: loungeRoom,
    walkingLineMin: 0,
    walkingLineMax: 15,
    doorZones: { left: DOOR_ZONES.left, right: DOOR_ZONES.right },
  },
  {
    id: 'alapista',
    name: 'Ferrari VIP Pista Game',
    background: AlaPistaRoom,
    walkingLineMin: 0,
    walkingLineMax: 15,
    doorZones: { 
      left: DOOR_ZONES.left, 
      right: DOOR_ZONES.right, 
      game: { 
        start: Math.round(1280 * 0.64),
        end: Math.round(1280 * 0.77),
        vertMin: 10,
      }
    },
    hasGameDoor: true,
  },
  {
    id: 'vega',
    name: 'VG RACING Lounge',
    background: vegaRoom,
    walkingLineMin: 0,
    walkingLineMax: 13.8,
    doorZones: { 
      left: DOOR_ZONES.left, 
      right: DOOR_ZONES.right,
      colosseum: {
        start: Math.round(1280 * 0.88),  // Right side of canvas
        end: Math.round(1280 * 0.98),
        vertMin: 0,  // Active from the floor up
      }
    },
    hasColosseumDoor: true,
  }
];

// ──────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────
interface ChatUser {
  id: string;
  name: string;
  isClubMember?: boolean;
  isOnline?: boolean;
}

interface ChatMessage {
  id: string;
  user: ChatUser;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'system';
  voiceUrl?: string;
  voiceDuration?: number;
  reactions: MessageReaction[];
  isPinned?: boolean;
  pinnedBy?: ChatUser;
  pinnedAt?: Date;
}

interface MessageReaction {
  emoji: string;
  users: ChatUser[];
  count: number;
}

interface MultiplayerRenderPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'left' | 'right';
  currentAnimation: 'walk' | 'idle';
}

// ──────────────────────────────────────────────
// GAME ACTIVATION PROMPT COMPONENT
// ──────────────────────────────────────────────
function GameActivationPrompt({
  isVisible,
  onStartGame,
  onContinueWalking
}: {
  isVisible: boolean;
  onStartGame: () => void;
  onContinueWalking: () => void;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-2xl p-5 border-2 border-none max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden transform -translate-y-8">
        <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-2xl mt-8"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-gray-700/10 rounded-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-black text-white mb-2 tracking-wider leading-tight"
             style={{ fontFamily: 'Sixtyfour', letterSpacing: '0.05em' }}
            >
              FERRARI RACING CHALLENGE
            </h3>
            <p className="text-gray-200 text-sm font-medium tracking-wide"
              style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}
            >
              Ready to test your skills on the track?
            </p>
          </div>
          
          <div className="flex flex-col space-y-3 items-center">
            <button
              onClick={onStartGame}
              className="bg-gradient-to-r from-white to-gray-200 text-red-700 font-bold py-2 px-4 rounded-xl hover:from-gray-100 hover:to-gray-300 transition-all duration-200 text-base tracking-wider shadow-lg hover:shadow-white/25 w-auto min-w-[150px] border border-white"
              style={{ fontFamily: 'Sixtyfour', letterSpacing: '0.05em' }}
            >
              START RACING
            </button>
            
            <button
              onClick={onContinueWalking}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-2 px-4 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-200 border border-gray-500 text-sm shadow-lg hover:shadow-gray-500/10 w-auto min-w-[150px]"
              style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}
            >
              Continue Exploring
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-300 tracking-wide"
             style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}
            >
              You can come back anytime to play!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// PLACEHOLDER PANEL COMPONENT
// ──────────────────────────────────────────────
function PlaceholderPanel({ icon, title, desc, color }: { 
  icon: string; 
  title: string; 
  desc: string; 
  color: 'purple' | 'blue' | 'yellow';
}) {
  const bgClass = color === 'purple' 
    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
    : color === 'blue'
    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="text-5xl">{icon}</div>
      <div 
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
        className="text-2xl text-white"
      >
        {title}
      </div>
      <p className="text-sm text-gray-400 max-w-md">
        {desc}
      </p>
      <div 
        className={`px-4 py-2 rounded-lg border text-xs ${bgClass}`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
      >
        COMING SOON
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// LOADING SCREEN COMPONENT
// ──────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 to-black p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>
      <div className="w-full max-w-7xl relative z-10">
        <div className="bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-3xl p-8 shadow-2xl border border-red-500/50 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-gray-700/10 rounded-3xl pointer-events-none"></div>
          <h2 className="text-4xl font-black text-white font-['Bebas Neue'] text-center tracking-wider relative z-10">
            FERRARI LUCKY RACE ROOM
          </h2>
        </div>
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-3xl p-12 shadow-2xl border border-red-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-3xl"></div>
            <div className="text-white text-center relative z-10">
              <div className="text-2xl font-['Zalando Sans SemiExpanded'] mb-6 font-medium">Loading Desktop Version...</div>
              <div className="text-6xl animate-pulse">🏎️</div>
              <div className="mt-6 w-48 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinServerModal({
  playerTag,
  setPlayerTag,
  onJoin,
  isJoining,
  connectionError,
}: {
  playerTag: string;
  setPlayerTag: (value: string) => void;
  onJoin: () => void;
  isJoining: boolean;
  connectionError: string | null;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-black/90 p-6 shadow-2xl">
        <h3 className="text-white text-2xl mb-2" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.08em' }}>
          JOIN OPEN ROOM
        </h3>
        <p className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
          Enter your tag name to join the same Colyseus room and test live walking/chat sync.
        </p>

        <input
          value={playerTag}
          onChange={(e) => setPlayerTag(e.target.value)}
          placeholder="ex: cesar_01"
          className="w-full rounded-lg bg-gray-900 border border-red-500/30 text-white px-3 py-2 outline-none focus:border-red-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onJoin();
          }}
        />

        {connectionError && (
          <p className="text-red-300 text-xs mt-3">{connectionError}</p>
        )}

        <button
          onClick={onJoin}
          disabled={!playerTag.trim() || isJoining}
          className="mt-4 w-full rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 font-semibold"
          style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.08em' }}
        >
          {isJoining ? 'CONNECTING...' : 'ENTER SHOWROOM'}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// RACER SCREEN COMPONENT
// ──────────────────────────────────────────────
function RacerScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 to-black p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>
      <div className="w-full max-w-7xl relative z-10">
        <RacerApp onClose={onClose} />
      </div>
    </div>
  );
}

function CharacterSprite({ 
  position, 
  verticalPosition,
  direction, 
  currentFrame, 
  SPRITE_CONFIG, 
  spriteSheet 
}: {
  position: number;
  verticalPosition: number;
  direction: 'left' | 'right';
  currentFrame: number;
  SPRITE_CONFIG: any;
  spriteSheet: string;
}) {
  const { frameWidth, frameHeight, displayScale } = SPRITE_CONFIG;
  const TOTAL_FRAMES = 12;
  
  const visualW = Math.round(frameWidth * displayScale);
  const visualH = Math.round(frameHeight * displayScale);
  
  // FIXED: Reduce trim to keep feet on the walking line
  const SPRITE_FOOT_TRIM_RATIO = 0.05; // Reduced from 0.08
  const footTrim = Math.round(frameHeight * displayScale * SPRITE_FOOT_TRIM_RATIO);
  
  const croppedH = visualH - footTrim;
  const scaledSheetW = Math.round(frameWidth * TOTAL_FRAMES * displayScale);
  const scaledFrameOffsetX = Math.round(currentFrame * frameWidth * displayScale);
  const bgOffsetY = -footTrim;

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${Math.round(position)}px`,
        bottom: `${Math.round(verticalPosition)}px`,
        width: `${visualW}px`,
        height: `${croppedH}px`,
        overflow: 'hidden',
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        transformOrigin: 'bottom center', // Changed from center center
        marginLeft: `-${Math.round(visualW / 2)}px`,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${scaledFrameOffsetX}px ${bgOffsetY}px`,
        backgroundSize: `${scaledSheetW}px ${visualH}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  );
}

// ──────────────────────────────────────────────
// DOOR DEBUG / DEBUG ELEMENTS (guard included)
// ──────────────────────────────────────────────
function DoorDebug({ zone, exit, color, label }: {
  zone: { start: number; end: number };
  exit: { x: number };
  color: 'green' | 'red' | 'yellow';
  label: string;
}) {
  const borderColor = color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : '#FBBF24';
  const bgColor = color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : '#FBBF24';

  return (
    <>
      <div 
        className="absolute top-0 bottom-0 border-2 opacity-40 z-15"
        style={{ 
          left: `${zone.start}px`,
          width: `${zone.end - zone.start}px`,
          borderColor: borderColor
        }}
      />
      <div 
        className="absolute top-2 text-white text-xs p-2 rounded-xl z-20 font-['Zalando Sans SemiExpanded'] font-medium border border-white/20"
        style={{ 
          left: `${exit.x}px`,
          backgroundColor: bgColor
        }}
      >
        {label}
      </div>
    </>
  );
}

// In GameOneWeb.tsx, update the DebugElements function
// Change the game door debug to show it only starts from the blue line:

function DebugElements({ gameLogic, verticalPosition }: { gameLogic: any; verticalPosition: number }) {
  if (process.env.NODE_ENV !== 'development' || gameLogic.isTransitioning) return null;

  const roomConfig = gameLogic.roomConfig;
  if (!roomConfig) return null;

  const vertMin = roomConfig.verticalRange?.min ?? 0;
  const vertMax = roomConfig.verticalRange?.max ?? 100;

  return (
    <>
      {/* Red line = floor / walkingLineMin */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${vertMin}px`, height: '2px',
          background: 'rgba(248,113,113,0.8)',
          zIndex: 10, pointerEvents: 'none',
        }}
      />
      {/* Blue line = walkingLineMax */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${vertMax}px`, height: '2px',
          background: 'rgba(96,165,250,0.8)',
          zIndex: 10, pointerEvents: 'none',
        }}
      />

      {roomConfig.leftExit?.enabled && (
        <DoorDebug
          zone={roomConfig.doorZones.left}
          exit={roomConfig.leftExit}
          color="green"
          label="← Exit"
        />
      )}

      {roomConfig.rightExit?.enabled && (
        <DoorDebug
          zone={roomConfig.doorZones.right}
          exit={roomConfig.rightExit}
          color="red"
          label="Exit →"
        />
      )}

      {roomConfig.gameExit && (
        <>
          <div 
            className="absolute border-2 opacity-40 z-15"
            style={{ 
              left: `${roomConfig.doorZones.game.start}px`,
              width: `${roomConfig.doorZones.game.end - roomConfig.doorZones.game.start}px`,
              bottom: `${vertMax}px`,
              height: `${vertMax * 0.5}px`,
              borderColor: '#FBBF24'
            }}
          />
          <div 
            className="absolute text-white text-xs p-2 rounded-xl z-20 font-['Zalando Sans SemiExpanded'] font-medium border border-white/20"
            style={{ 
              left: `${roomConfig.gameExit.x}px`,
              bottom: `${vertMax + 20}px`,
              backgroundColor: '#FBBF24'
            }}
          >
            🎮 Game (walk up)
          </div>
        </>
      )}

      {/* Colosseum door debug */}
      {roomConfig.colosseumExit && (
        <>
          <div 
            className="absolute border-2 opacity-40 z-15"
            style={{ 
              left: `${roomConfig.doorZones.colosseum.start}px`,
              width: `${roomConfig.doorZones.colosseum.end - roomConfig.doorZones.colosseum.start}px`,
              bottom: `${vertMin}px`,
              height: `${(vertMax - vertMin) * 0.6}px`,
              borderColor: '#8B5CF6'
            }}
          />
          <div 
            className="absolute text-white text-xs p-2 rounded-xl z-20 font-['Zalando Sans SemiExpanded'] font-medium border border-white/20"
            style={{ 
              left: `${roomConfig.colosseumExit.x}px`,
              bottom: `${vertMin + 30}px`,
              backgroundColor: '#8B5CF6'
            }}
          >
            🏟️ Colosseum
          </div>
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// TRANSITION HELPERS
// ──────────────────────────────────────────────
function getTransitionOpacity(transitionProgress: number) {
  if (transitionProgress < 0.4) {
    return transitionProgress / 0.4;
  } else if (transitionProgress < 0.6) {
    return 1;
  } else {
    return 1 - ((transitionProgress - 0.6) / 0.4);
  }
}

function getDisplayBackground(
  transitionProgress: number, 
  nextRoomIndex: number | null, 
  currentRoom: any, 
  ROOM_CONFIG: any[]
) {
  return transitionProgress >= 0.5 ? 
    (nextRoomIndex !== null ? ROOM_CONFIG[nextRoomIndex].background : currentRoom.background) : 
    currentRoom.background;
}

// ──────────────────────────────────────────────
// HUD MODULE (glass panel — NO backdrop-blur)
// backdrop-blur-xl was triggering a GPU compositing pass for every panel
// (6+ per frame). Replaced with a solid rgba background that looks identical
// but costs nothing on the GPU compositor during the game RAF loop.
// ──────────────────────────────────────────────
function HUDModule({ children, accentColor = '#EF4444' }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div className="relative rounded-2xl border border-white/10 overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.55)',
        boxShadow: `0 0 40px ${accentColor}20, inset 0 1px rgba(255,255,255,0.05)`,
        // will-change: transform promotes to its own compositor layer so Chrome
        // doesn't re-paint it when the game canvas updates.
        willChange: 'transform',
      }}>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// AMBIENT STATUS BAR (tight)
// ──────────────────────────────────────────────
function StatusBar({ roomName }: { roomName: string }) {
  const fps = useRef(Math.floor(55 + Math.random()*10)).current;
  const ping = useRef(Math.floor(18 + Math.random()*15)).current;
  const online = useRef(Math.floor(100 + Math.random()*50)).current;
  return (
    <div className="flex items-center gap-6 px-4 py-1 text-[10px] text-gray-400 bg-black/20 border-b border-white/5"
      style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>
      <span className="text-red-400">{roomName}</span>
      <span className="flex items-center gap-1"><Wifi className="w-3 h-3"/>{ping}ms</span>
      <span className="flex items-center gap-1"><Gauge className="w-3 h-3"/>{fps} FPS</span>
      <span className="flex items-center gap-1 ml-auto"><Users className="w-3 h-3"/>{online} ONLINE</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// ICON-ONLY COMMAND BAR (tight)
// ──────────────────────────────────────────────
function CommandBar({ onOpenModal }: { onOpenModal: (command: string) => void }) {
  const commands = [
    { id: 'garage', icon: Car },
    { id: 'races',  icon: Flag },
    { id: 'nft',    icon: Gem },
    { id: 'social', icon: Users },
    { id: 'shop',   icon: ShoppingBag },
    { id: 'btc',    icon: Bitcoin },
  ];

  return (
    <div className="flex items-center justify-center gap-6 py-2 px-6 border border-white/10 rounded-b-xl"
      style={{ background: 'rgba(0,0,0,0.6)', boxShadow: '0 0 30px rgba(255,0,0,0.1)' }}>
      {commands.map((cmd) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.id}
            onClick={() => onOpenModal(cmd.id)}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
            title={cmd.id.charAt(0).toUpperCase() + cmd.id.slice(1)}
          >
            <Icon className="w-5 h-5 text-white/80" />
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// COMMAND POPOVER – rich content, 2x taller
// ──────────────────────────────────────────────
function CommandPopover({ command, onClose }: { command: string; onClose: () => void }) {
  const richContent: Record<string, React.ReactNode> = {
    garage: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-red-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>YOUR GARAGE</h3>
        </div>
        <p className="text-gray-400 text-sm">Browse your collected Ferraris, upgrade performance, and select your ride.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center text-xs text-gray-300">F40 LM<br/><span className="text-red-400">SELECTED</span></div>
          <div className="bg-white/5 rounded-lg p-3 text-center text-xs text-gray-300">SF90 XX<br/><span className="text-gray-500">LOCKED</span></div>
        </div>
      </div>
    ),
    races: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Flag className="w-8 h-8 text-red-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>UPCOMING RACES</h3>
        </div>
        <p className="text-gray-400 text-sm">Join live events, check leaderboards, and prove you're the fastest.</p>
        <div className="space-y-2">
          <div className="flex justify-between bg-white/5 rounded-lg p-3 text-xs">
            <span className="text-white">MONZA GP</span><span className="text-red-400">02:14:22</span>
          </div>
          <div className="flex justify-between bg-white/5 rounded-lg p-3 text-xs">
            <span className="text-white">NÜRBURGRING</span><span className="text-gray-500">LOCKED</span>
          </div>
        </div>
      </div>
    ),
    nft: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Gem className="w-8 h-8 text-red-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>NFT DROP</h3>
        </div>
        <p className="text-gray-400 text-sm">Exclusive Ferrari digital collectibles. Mint, trade, and showcase.</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg h-20 flex items-center justify-center text-2xl">🏎️</div>
          <div className="bg-white/5 rounded-lg h-20 flex items-center justify-center text-2xl">🏆</div>
          <div className="bg-white/5 rounded-lg h-20 flex items-center justify-center text-2xl">💎</div>
        </div>
      </div>
    ),
    social: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-red-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>FRIENDS</h3>
        </div>
        <p className="text-gray-400 text-sm">Manage your contacts, join friends' rooms, and challenge rivals.</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-white">CE</div>
            <span className="text-white">Cesar</span><span className="ml-auto text-green-400">● Online</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-white">ER</div>
            <span className="text-white">Enzo</span><span className="ml-auto text-gray-500">Offline</span>
          </div>
        </div>
      </div>
    ),
    shop: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-red-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>SHOP</h3>
        </div>
        <p className="text-gray-400 text-sm">Performance parts, limited merch, and in-game perks.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center text-xs text-gray-300">Tire Set<br/><span className="text-red-400">$500</span></div>
          <div className="bg-white/5 rounded-lg p-3 text-center text-xs text-gray-300">Turbo Kit<br/><span className="text-gray-500">$1,200</span></div>
        </div>
      </div>
    ),
    btc: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Bitcoin className="w-8 h-8 text-yellow-400" />
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Bebas Neue' }}>BTC WALLET</h3>
        </div>
        <p className="text-gray-400 text-sm">Send & receive BTC instantly. Your in-game wallet is always ready.</p>
        <div className="w-full bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl text-yellow-400 font-bold">0.025 BTC</div>
          <div className="text-xs text-gray-500 mt-1">≈ $1,240 USD</div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded-lg text-xs font-bold transition">SEND</button>
          <button className="flex-1 py-2 bg-gray-500/20 hover:bg-gray-500/40 text-gray-300 rounded-lg text-xs font-bold transition">RECEIVE</button>
        </div>
      </div>
    ),
  };

  const content = richContent[command] || richContent.garage;

  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 w-80 md:w-96 max-h-[512px]">
      <div className="rounded-2xl border border-white/10 p-5 shadow-2xl overflow-y-auto"
        style={{ maxHeight: '512px', background: 'rgba(0,0,0,0.88)', boxShadow: '0 0 30px rgba(255,0,0,0.2), inset 0 1px rgba(255,255,255,0.05)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition z-10">
          <X className="w-4 h-4" />
        </button>
        <div className="text-gray-300" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
          {content}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// FLOATING CHAT OVERLAY (2x taller)
// ──────────────────────────────────────────────
function ChatOverlay({
  chatMinimized,
  setChatMinimized,
  autoScroll,
  setAutoScroll,
  chatContainerRef,
  onScroll,
  currentUser,
  externalMessages,
  isMultiplayerConnected,
  onMessageSend,
  onMessageReact,
  onMessagePin,
  onVoiceMessage,
}: {
  chatMinimized: boolean;
  setChatMinimized: (val: boolean) => void;
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  currentUser: ChatUser;
  externalMessages: ChatMessage[];
  isMultiplayerConnected: boolean;
  onMessageSend: (message: string | Partial<ChatMessage>) => void;
  onMessageReact: (messageId: string, emoji: string) => void;
  onMessagePin: (messageId: string) => void;
  onVoiceMessage: (audioBlob: Blob) => Promise<string>;
}) {
  const [activePanel, setActivePanel] = React.useState<'chat' | 'pokedex' | 'friends' | 'btc'>('chat');

  if (chatMinimized) {
    return (
      <button
        onClick={() => setChatMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all shadow-[0_0_30px_rgba(255,0,0,0.15)]"
        style={{ background: 'rgba(0,0,0,0.7)', boxShadow: '0 0 40px rgba(255,0,0,0.2), inset 0 1px rgba(255,255,255,0.05)' }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
      </button>
    );
  }

  const tabs = [
    { id: 'chat' as const, icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'LIVE CHAT', badge: <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />, border: 'border-red-500', bg: 'bg-red-500/10' },
    { id: 'pokedex' as const, icon: <span className="text-[11px]">⚡</span>, label: 'GAME DECK', badge: <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">SOON</span>, border: 'border-purple-500', bg: 'bg-purple-500/10' },
    { id: 'friends' as const, icon: <span className="text-[11px]">👥</span>, label: 'FRIENDS', badge: <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">SOON</span>, border: 'border-blue-500', bg: 'bg-blue-500/10' },
    { id: 'btc' as const, icon: <span className="text-[11px]">₿</span>, label: 'SEND BTC', badge: <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">SOON</span>, border: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.88)', boxShadow: '0 0 40px rgba(255,0,0,0.15), inset 0 1px rgba(255,255,255,0.05)' }}>

      <div className="flex items-stretch border-b border-white/10 bg-black/40">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { 
              setActivePanel(tab.id); 
              setChatMinimized(activePanel === tab.id ? !chatMinimized : false); 
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider transition-all border-b-2 ${
              activePanel === tab.id && !chatMinimized
                ? `${tab.border} text-white ${tab.bg}`
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3 px-4">
          {activePanel === 'chat' && !chatMinimized && (
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg transition-colors text-xs ${autoScroll ? 'text-green-400 bg-green-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'}`}
              title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            >
              {autoScroll ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => setChatMinimized(!chatMinimized)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/60 transition-colors"
            title={chatMinimized ? 'Expand' : 'Collapse'}
          >
            {chatMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!chatMinimized && (
        <div className="h-128 w-full">
          {activePanel === 'chat' && (
            <VirtualChat
              roomId="ferrari-global-chat"
              currentUser={currentUser}
              height={512}
              disableDemoMessages={isMultiplayerConnected}
              externalMessages={externalMessages}
              onMessageSend={onMessageSend}
              onMessageReact={onMessageReact}
              onMessagePin={onMessagePin}
              onVoiceMessage={onVoiceMessage}
            />
          )}

          {activePanel === 'pokedex' && (
            <PlaceholderPanel 
              icon="⚡" 
              title="GAME DECK" 
              desc="Collect, trade, and battle with your Ferrari racing cards. Unlock exclusive NFT liveries and race specs. Choose your room from your deck."
              color="purple" 
            />
          )}

          {activePanel === 'friends' && (
            <PlaceholderPanel 
              icon="👥" 
              title="FRIENDS & ROOMS" 
              desc="Add friends, see which rooms they are in, join them instantly or challenge them to a race."
              color="blue" 
            />
          )}

          {activePanel === 'btc' && (
            <PlaceholderPanel 
              icon="₿" 
              title="INSTANT BTC TRANSFER" 
              desc="Send BTC on the fly — tip a friend, pay an entry fee, or settle a race bet. Lightning-fast, in-game wallet."
              color="yellow" 
            />
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// GAME AREA (tight minHeight, uses verticalPosition)
// ──────────────────────────────────────────────
function GameArea({ 
  gameAreaRef, 
  displayBackground, 
  gameLogic, 
  verticalPosition,
  transitionOpacity, 
  currentFrame, 
  position, 
  direction, 
  isTransitioning,
  remotePlayers,
  localPlayerTag,
  localPlayerId,
}: {
  gameAreaRef: React.RefObject<HTMLDivElement>;
  displayBackground: string;
  gameLogic: any;
  verticalPosition: number;
  transitionOpacity: number;
  currentFrame: number;
  position: number;
  direction: 'left' | 'right';
  isTransitioning: boolean;
  remotePlayers: MultiplayerRenderPlayer[];
  localPlayerTag: string;
  localPlayerId: string;
}) {
  const shortId = (value: string) => String(value || 'guest').slice(0, 6);

  return (
    <div className="w-full h-full flex items-center justify-center min-h-0">
      <div
        ref={gameAreaRef}
        className="relative overflow-hidden rounded-xl border border-red-500/20 shadow-lg"
        style={{
          lineHeight: 0,
          fontSize: 0,
          maxWidth: '100%',
          maxHeight: '100%',
          boxShadow: '0 0 60px rgba(255,0,0,0.15), inset 0 1px rgba(255,255,255,0.05)',
        }}
      >
          <img
            src={displayBackground}
            alt="Room"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', verticalAlign: 'bottom' }}
            draggable={false}
          />
          <DebugElements gameLogic={gameLogic} verticalPosition={verticalPosition} />
          <CharacterSprite
            position={position}
            verticalPosition={verticalPosition}
            direction={direction}
            currentFrame={currentFrame}
            SPRITE_CONFIG={SPRITE_CONFIG}
            spriteSheet={spriteSheet}
          />

          <div
            className="absolute z-30 text-white text-[11px] px-2 py-0.5 rounded bg-red-900/75 border border-red-300/40"
            style={{
              left: `${Math.round(position)}px`,
              bottom: `${Math.round(verticalPosition + (SPRITE_VISUAL_H - SPRITE_FOOT_TRIM) + 8)}px`,
              transform: 'translateX(-50%)',
              fontFamily: 'Bebas Neue',
              letterSpacing: '0.06em',
              pointerEvents: 'none',
            }}
          >
            {localPlayerTag} • {shortId(localPlayerId)}
          </div>

          {remotePlayers.map((player) => (
            <React.Fragment key={player.id}>
              <CharacterSprite
                position={player.x}
                verticalPosition={player.y}
                direction={player.direction}
                currentFrame={player.currentAnimation === 'walk' ? currentFrame : 0}
                SPRITE_CONFIG={SPRITE_CONFIG}
                spriteSheet={spriteSheet}
              />
              <div
                className="absolute z-30 text-white text-[11px] px-2 py-0.5 rounded bg-black/70 border border-white/20"
                style={{
                  left: `${Math.round(player.x)}px`,
                  bottom: `${Math.round(player.y + (SPRITE_VISUAL_H - SPRITE_FOOT_TRIM) + 8)}px`,
                  transform: 'translateX(-50%)',
                  fontFamily: 'Bebas Neue',
                  letterSpacing: '0.06em',
                  pointerEvents: 'none',
                }}
              >
                {player.name} • {shortId(player.id)}
              </div>
            </React.Fragment>
          ))}

          {isTransitioning && (
            <div
              className="absolute inset-0 bg-black z-30 transition-opacity duration-300"
              style={{ opacity: transitionOpacity }}
            />
          )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN COMPONENT - GAME ONE WEB
// ──────────────────────────────────────────────
export default function GameOneWeb() {
  // isMobile intentionally removed — mobile routing is handled by gameOne.tsx
  // before GameOneWeb is ever mounted. A second isMobile check here was the
  // root cause of the Safari "dispatcher.useContext" crash (conditional hook
  // ordering violation via the early <GameOneMobile> return).
  const [isClient, setIsClient] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [commandModal, setCommandModal] = useState<string | null>(null);
  const [showColosseum, setShowColosseum] = useState(false);
  const [playerTagInput, setPlayerTagInput] = useState('');
  const [hasJoinedServer, setHasJoinedServer] = useState(false);
  const [isJoiningServer, setIsJoiningServer] = useState(false);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMovementSyncRef = useRef(0);
  
const { currentAnimation, currentFrame, playAnimation, playStopAnimation } = useWalkingAnimation(SPRITE_CONFIG);

  const {
    client,
    players,
    chatMessages: multiplayerChatMessages,
    connected,
    myPlayer,
    connectionError,
    connect,
    sendMovement,
    sendChatMessage,
  } = useFerrariMultiplayer();

  const gameLogic = useGameLogic({
    spriteConfig: SPRITE_CONFIG,
    roomConfig: ROOM_CONFIG,
    isMobile: false, // Mobile routing handled by gameOne.tsx before this component mounts
    spriteVisualWidth: SPRITE_VISUAL_W,
  });

  const handleStartGame = () => {
    gameLogic.openRacerApp();
  };
  
  const handleContinueWalking = () => {
    gameLogic.handleContinueWalking();
  };

  const [currentUser, setCurrentUser] = useState<ChatUser>({
    id: 'player-' + Math.random().toString(36).substr(2, 9),
    name: 'Guest',
    isClubMember: false,
    isOnline: true
  });

  const handleJoinServer = () => {
    const cleanTag = playerTagInput.trim();
    if (!cleanTag) return;

    setCurrentUser({
      id: 'player-' + Math.random().toString(36).substr(2, 9),
      name: cleanTag,
      isClubMember: false,
      isOnline: true,
    });
    setHasJoinedServer(true);
  };

  // ── ALL ORIGINAL USEFFECTS (fonts, resize, keyboard, movement, chat) ──
  useEffect(() => {
    if (!autoScroll || !chatContainerRef.current) return;
    const container = chatContainerRef.current;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages, autoScroll]);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fonts = [
          new FontFace('Sixtyfour', `url(${SixtyfourTTF})`),
          new FontFace('Bebas Neue', `url(${BebasNeueTTF})`),
          new FontFace('Zalando Sans SemiExpanded', `url(${ZalandoSansTTF})`)
        ];
  
        const loadedFonts = await Promise.all(fonts.map(font => font.load()));
        loadedFonts.forEach(font => document.fonts.add(font));
        setFontsLoaded(true);
      } catch (error) {
        console.error('Failed to load fonts:', error);
        setFontsLoaded(true);
      }
    };
  
    loadFonts();
  }, []);

  useEffect(() => {
    if (!isClient || !hasJoinedServer || connected || isJoiningServer || !client) return;

    let cancelled = false;

    const join = async () => {
      setIsJoiningServer(true);
      try {
        await connect(currentUser.name);
      } finally {
        if (!cancelled) {
          setIsJoiningServer(false);
        }
      }
    };

    join();

    return () => {
      cancelled = true;
    };
  }, [isClient, hasJoinedServer, connected, isJoiningServer, client, connect, currentUser.name]);

  useEffect(() => {
    if (!connected) return;

    const now = Date.now();
    if (now - lastMovementSyncRef.current < 80) return;
    lastMovementSyncRef.current = now;

    sendMovement({
      x: Math.round(gameLogic.position),
      y: Math.round(gameLogic.verticalPosition),
      direction: gameLogic.direction,
      animation: currentAnimation,
      roomId: gameLogic.currentRoom?.id || 'outside',
    });
  }, [
    connected,
    sendMovement,
    gameLogic.position,
    gameLogic.verticalPosition,
    gameLogic.direction,
    gameLogic.currentRoom?.id,
    currentAnimation,
  ]);

  useEffect(() => {
    if (!connected) return;

    const normalizedMessages: ChatMessage[] = multiplayerChatMessages.map((message: any) => ({
      id: String(message.id ?? Date.now()),
      user: {
        id: String(message.playerId ?? 'system'),
        name: String(message.playerName ?? 'System'),
        isClubMember: false,
        isOnline: true,
      },
      content: String(message.content ?? ''),
      timestamp: new Date(Number(message.timestamp ?? Date.now())),
      type: 'text',
      reactions: [],
    }));

    setChatMessages(normalizedMessages);
  }, [connected, multiplayerChatMessages]);

  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      if (gameAreaRef.current) {
        const container = gameAreaRef.current.getBoundingClientRect();
        const w = Math.floor(container.width);
        const h = Math.floor(container.height);
        gameLogic.setGameSize({ width: w, height: h });

        const zones = makeDoorZones(w);
        gameLogic.setDoorZones?.({
          left: zones.left,
          right: zones.right,
          game: zones.game,
        });
      }
    };

    const measureTimeout = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(measureTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [gameLogic]);

// ── REFS: live key/game state the RAF loop reads directly ──────────────────
// These are updated synchronously on every keydown/keyup and every render.
// The RAF loop reads from refs — NEVER from React state — so it never triggers
// a re-render or causes a loop restart. This is the key fix for Chrome lag:
// before, keysPressed was in the dependency array → every keypress restarted
// the RAF loop → micro-stutter every keydown event.
const keysRef = useRef({ left: false, right: false, up: false, down: false });
const forcedIdleRef   = useRef(gameLogic.forcedIdle);
const isTransRef      = useRef(gameLogic.isTransitioning);
const showRacerRef     = useRef(gameLogic.showRacerApp);
const showColosseumRef = useRef(false);

// Keep refs in sync with React state each render
forcedIdleRef.current   = gameLogic.forcedIdle;
isTransRef.current      = gameLogic.isTransitioning;
showRacerRef.current    = gameLogic.showRacerApp;
showColosseumRef.current = showColosseum;

// ── KEYBOARD HANDLERS ──────────────────────────────────────────────────────
useEffect(() => {
  if (!isClient) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isTransRef.current || showRacerRef.current || e.repeat) return;

    switch (e.code) {
      case 'ArrowRight': case 'KeyD':
        e.preventDefault();
        keysRef.current.right = true;
        gameLogic.setKeysPressed(prev => ({ ...prev, right: true }));
        gameLogic.setDirection('right');
        break;
      case 'ArrowLeft': case 'KeyA':
        e.preventDefault();
        keysRef.current.left = true;
        gameLogic.setKeysPressed(prev => ({ ...prev, left: true }));
        gameLogic.setDirection('left');
        break;
      case 'ArrowUp': case 'KeyW':
        e.preventDefault();
        keysRef.current.up = true;
        gameLogic.setKeysPressed(prev => ({ ...prev, up: true }));
        break;
      case 'ArrowDown': case 'KeyS':
        e.preventDefault();
        keysRef.current.down = true;
        gameLogic.setKeysPressed(prev => ({ ...prev, down: true }));
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowRight': case 'KeyD':
        keysRef.current.right = false;
        gameLogic.setKeysPressed(prev => ({ ...prev, right: false }));
        break;
      case 'ArrowLeft': case 'KeyA':
        keysRef.current.left = false;
        gameLogic.setKeysPressed(prev => ({ ...prev, left: false }));
        break;
      case 'ArrowUp': case 'KeyW':
        keysRef.current.up = false;
        gameLogic.setKeysPressed(prev => ({ ...prev, up: false }));
        break;
      case 'ArrowDown': case 'KeyS':
        keysRef.current.down = false;
        gameLogic.setKeysPressed(prev => ({ ...prev, down: false }));
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
  // Stable deps only — gameLogic.setKeysPressed and setDirection are useCallback refs
}, [isClient, gameLogic.setKeysPressed, gameLogic.setDirection]);

// ── SINGLE MASTER RAF LOOP: movement + animation trigger ───────────────────
// One loop, stable deps (only isClient). Reads everything from refs.
// Never restarts on keypress, position change, or re-render.
useEffect(() => {
  if (!isClient) return;

  let rafId: number;
  let lastTime = performance.now();

  // Velocity accumulators — local to the loop closure, never in React state
  let velH  = 0;
  let velUp = 0;
  let velDn = 0;

  const H_ACCEL = 0.32;
  const H_DECEL = 0.28;
  const V_ACCEL = 0.06;
  const V_DECEL = 0.10;
  const V_MAX   = 0.55;

  const loop = (now: number) => {
    const dt = Math.min((now - lastTime) / 16.667, 3);
    lastTime = now;

    const keys = keysRef.current;
    const paused = isTransRef.current || showRacerRef.current || showColosseumRef.current;

    if (!paused) {
      // ── Horizontal ──
      const wantH = keys.right ? 1 : keys.left ? -1 : 0;
      if (wantH !== 0) {
        velH += (wantH - velH) * H_ACCEL * dt;
        velH = Math.max(-1, Math.min(1, velH));
      } else {
        velH *= Math.pow(1 - H_DECEL, dt);
        if (Math.abs(velH) < 0.01) velH = 0;
      }
      if (Math.abs(velH) > 0.01) {
        gameLogic.handleMovement(velH > 0 ? 'right' : 'left', Math.abs(velH) * dt);
      }

      // ── Vertical ──
      if (keys.up)  { velUp += (V_MAX - velUp) * V_ACCEL * dt; }
      else          { velUp *= Math.pow(1 - V_DECEL, dt); if (velUp < 0.005) velUp = 0; }
      if (keys.down){ velDn += (V_MAX - velDn) * V_ACCEL * dt; }
      else          { velDn *= Math.pow(1 - V_DECEL, dt); if (velDn < 0.005) velDn = 0; }

      const netV = velUp - velDn;
      if (Math.abs(netV) > 0.005) {
        gameLogic.handleVerticalMovement(netV > 0 ? 'up' : 'down', Math.abs(netV) * dt);
      }

      // ── Animation (same tick, same state read) ──
      const anyMoving = keys.left || keys.right || keys.up || keys.down;
      if (forcedIdleRef.current) {
        playAnimation('idle');
      } else if (anyMoving) {
        playAnimation('walk');
      } else {
        playStopAnimation();
      }
    } else {
      // While transitioning/racing, bleed velocities to zero
      velH = 0; velUp = 0; velDn = 0;
      playAnimation('idle');
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
  // Stable deps: only functions that are useCallback with [] or [stable] deps.
  // handleMovement/handleVerticalMovement are useCallback in useGameLogic.
  // playAnimation/playStopAnimation are useCallback in useWalkingAnimation.
  // None of these change identity across renders → loop never restarts.
}, [isClient, gameLogic.handleMovement, gameLogic.handleVerticalMovement, playAnimation, playStopAnimation]);

  // ── Google Fonts (unchanged) ──
  useEffect(() => {
    const existing = document.head.querySelector('link[data-gf="ferrari"]');
    if (existing) return;

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Zalando+Sans+SemiExpanded:wght@200..900&display=swap';
    link.rel = 'stylesheet';
    link.setAttribute('data-gf', 'ferrari');
    document.head.appendChild(link);

    return () => {
      if (link.parentNode === document.head) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // ── Seed chat (unchanged) ──
  useEffect(() => {
    setChatMessages([
      {
        id: '1',
        user: { id: 'ferrari-official', name: 'Ferrari Official', isClubMember: true },
        content: 'Welcome to Ferrari Chat! 🏎️ Start your engines and join the conversation!',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
        reactions: [
          { emoji: '❤️', users: [], count: 1 },
          { emoji: '🏎️', users: [], count: 3 }
        ],
        isPinned: true,
        pinnedBy: { id: 'ferrari-official', name: 'Ferrari Official' },
        pinnedAt: new Date(Date.now() - 3500000)
      },
      {
        id: '2',
        user: { id: 'enzo-racer', name: 'Enzo Racer', isClubMember: true },
        content: 'Just completed the Pista challenge! What an amazing experience! 🚀',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text',
        reactions: [
          { emoji: '🔥', users: [], count: 2 },
          { emoji: '👏', users: [], count: 1 }
        ]
      },
      {
        id: '3',
        user: { id: 'speed-demon', name: 'Speed Demon', isClubMember: false },
        content: 'Can anyone help me with the racing line in the final corner?',
        timestamp: new Date(Date.now() - 900000),
        type: 'text',
        reactions: []
      }
    ]);
  }, []);

  const handleSendMessage = (message: string | Partial<ChatMessage>) => {
    const content = typeof message === 'string'
      ? message
      : String(message.content || '').trim();

    if (!content) return;

    if (connected) {
      sendChatMessage(content);
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: currentUser,
      content,
      timestamp: new Date(),
      type: 'text',
      reactions: []
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleMessageReact = (messageId: string, emoji: string) => {
    setChatMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find(r => r.emoji === emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, users: [...r.users, currentUser], count: r.count + 1 }
                  : r
              )
            };
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, users: [currentUser], count: 1 }]
            };
          }
        }
        return msg;
      })
    );
  };

  const handleMessagePin = (messageId: string) => {
    setChatMessages(prev => 
      prev.map(msg => ({
        ...msg,
        isPinned: msg.id === messageId
      }))
    );
  };

  const handleVoiceMessage = async (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const voiceUrl = URL.createObjectURL(audioBlob);
      setTimeout(() => {
        resolve(voiceUrl);
      }, 1000);
    });
  };


  // Mobile routing is handled by the parent gameOne.tsx which renders
  // GameOneMobile or GameOneWeb BEFORE any hooks run. Never conditionally
  // return a different component from inside GameOneWeb after hooks have
  // already been called — Safari's JS engine enforces hook ordering strictly
  // and throws "null is not an object (evaluating 'dispatcher.useContext')".
  if (!isClient) {
    return <LoadingScreen />;
  }

  if (showColosseum) {
    return (
      <ColosseumGame 
        playerName={currentUser.name}
        onExit={() => setShowColosseum(false)}
      />
    );
  }

  if (gameLogic.showRacerApp) {
    return <RacerScreen onClose={gameLogic.closeRacerApp} />;
  }

  const transitionOpacity = getTransitionOpacity(gameLogic.transitionProgress);
  const displayBackground = getDisplayBackground(
    gameLogic.transitionProgress, 
    gameLogic.nextRoomIndex, 
    gameLogic.currentRoom, 
    ROOM_CONFIG
  );

  const currentRoomId = gameLogic.currentRoom?.id || 'outside';
  const remotePlayers: MultiplayerRenderPlayer[] = Array.from(players.values())
    .filter((player: any) => {
      if (!player) return false;
      if (myPlayer && player.id === myPlayer.id) return false;
      return (player.roomId || 'outside') === currentRoomId;
    })
    .map((player: any) => ({
      id: String(player.id),
      name: String(player.name || 'Guest'),
      x: Number(player.x || 0),
      y: Number(player.y || 0),
      direction: player.direction === 'left' ? 'left' : 'right',
      currentAnimation: player.currentAnimation === 'walk' ? 'walk' : 'idle',
    }));

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-950 to-black px-4 py-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none" />

      <GameActivationPrompt
        isVisible={gameLogic.showGamePrompt || false}
        onStartGame={handleStartGame}
        onContinueWalking={handleContinueWalking}
      />

      {!hasJoinedServer && (
        <JoinServerModal
          playerTag={playerTagInput}
          setPlayerTag={setPlayerTagInput}
          onJoin={handleJoinServer}
          isJoining={isJoiningServer}
          connectionError={connectionError}
        />
      )}

      {/* Main layout */}
      <div className="flex w-full flex-1 gap-4 min-h-0">

        {/* LEFT PANEL */}
        <div className={`transition-all duration-300 ${leftPanelOpen ? 'w-[280px]' : 'w-0'} overflow-hidden flex-shrink-0`}>
          {leftPanelOpen && (
            <div className="flex flex-col gap-4 h-full pr-3">
              <HUDModule accentColor="#10B981">
                <GameAd title="LIVE PLAYERS" content="124 ONLINE" status="● ACTIVE" accentColor="#10B981" />
              </HUDModule>
              <HUDModule accentColor="#F59E0B">
                <GameAd title="BTC JACKPOT" content="0.025 BTC" status="LIVE" accentColor="#F59E0B" />
              </HUDModule>
              <HUDModule accentColor="#EC4899">
                <GameAd title="TODAY'S EVENT" content="FERRARI CHALLENGE" status="02:14:22" accentColor="#EC4899" actionLabel="ENTER" />
              </HUDModule>
              <div className="flex-1 min-h-0">
                <HUDModule accentColor="#EF4444">
                  <div className="relative h-full rounded-2xl overflow-hidden" style={{ minHeight: '299px' }}>
                    <img src={FERRARI_MODERN_URL} alt="SF90 XX" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                    <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                      <div className="text-xs uppercase tracking-[0.2em] text-red-400 mb-2" style={{ fontFamily: 'Bebas Neue' }}>FEATURED CAR</div>
                      <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Bebas Neue' }}>SF90 XX</div>
                      <div className="text-[10px] text-gray-400 mb-3" style={{ fontFamily: 'Zalando Sans' }}>Below retail. Delivered to your door.</div>
                      <button className="self-start flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition">
                        VIEW <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </HUDModule>
              </div>
            </div>
          )}
        </div>

        {/* GAME CENTER – with vertical movement */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative border border-red-500/20 rounded-xl overflow-hidden flex flex-col flex-1"
            style={{ background: 'rgba(0,0,0,0.1)', boxShadow: '0 0 80px rgba(255,0,0,0.1), inset 0 1px rgba(255,255,255,0.03)' }}>
            <StatusBar roomName={gameLogic.currentRoom.name} />
            <div className="flex-1 flex items-center justify-center px-2 py-1">
              <GameArea
                gameAreaRef={gameAreaRef}
                displayBackground={displayBackground}
                gameLogic={gameLogic}
                verticalPosition={gameLogic.verticalPosition}
                transitionOpacity={transitionOpacity}
                currentFrame={currentFrame}
                position={gameLogic.position}
                direction={gameLogic.direction}
                isTransitioning={gameLogic.isTransitioning}
                remotePlayers={remotePlayers}
                localPlayerTag={currentUser.name}
                localPlayerId={String(myPlayer?.id || currentUser.id)}
              />
            </div>

            {commandModal && <CommandPopover command={commandModal} onClose={() => setCommandModal(null)} />}

            <CommandBar onOpenModal={(cmd) => setCommandModal(cmd)} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={`transition-all duration-300 ${rightPanelOpen ? 'w-[280px]' : 'w-0'} overflow-hidden flex-shrink-0`}>
          {rightPanelOpen && (
            <div className="flex flex-col gap-4 h-full pl-3">
              <HUDModule accentColor="#8B5CF6">
                <GameAd title="CURRENT ROOM" content={gameLogic.currentRoom.name.toUpperCase()} status="124 PLAYERS" accentColor="#8B5CF6" />
              </HUDModule>
              <HUDModule accentColor="#FBBF24">
                <GameAd title="RANKING" content="#1 CESAR" status="TOP 1%" accentColor="#FBBF24" />
              </HUDModule>
              <HUDModule accentColor="#3B82F6">
                <GameAd title="TRACK STATUS" content="CLEAR" status="21°C" accentColor="#3B82F6" />
              </HUDModule>
              <div className="flex-1 min-h-0">
                <HUDModule accentColor="#3B82F6">
                  <div className="relative h-full rounded-2xl overflow-hidden" style={{ minHeight: '299px' }}>
                    <img src={gameAddTwo} alt="Carbon Series" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                    <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-400 mb-2" style={{ fontFamily: 'Bebas Neue' }}>CARBON SERIES</div>
                      <div className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Bebas Neue' }}>Limited Edition</div>
                      <div className="text-[10px] text-gray-400 mb-3" style={{ fontFamily: 'Zalando Sans' }}>Carbon fiber models. Below market.</div>
                      <button className="self-start flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition">
                        VIEW <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </HUDModule>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Panel toggle buttons */}
      <button
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        className="fixed top-1/2 -translate-y-1/2 z-40 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition"
        style={{ left: leftPanelOpen ? '280px' : '0px', background: 'rgba(0,0,0,0.6)' }}
      >
        <PanelLeftClose className={`w-4 h-4 text-white transition ${!leftPanelOpen ? 'rotate-180' : ''}`} />
      </button>

      <button
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className="fixed top-1/2 -translate-y-1/2 z-40 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition"
        style={{ right: rightPanelOpen ? '280px' : '0px', background: 'rgba(0,0,0,0.6)' }}
      >
        <PanelRightClose className={`w-4 h-4 text-white transition ${!rightPanelOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Chat Overlay */}
      <ChatOverlay
        chatMinimized={chatMinimized}
        setChatMinimized={setChatMinimized}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        chatContainerRef={chatContainerRef}
        onScroll={handleChatScroll}
        currentUser={currentUser}
        externalMessages={chatMessages}
        isMultiplayerConnected={connected}
        onMessageSend={handleSendMessage}
        onMessageReact={handleMessageReact}
        onMessagePin={handleMessagePin}
        onVoiceMessage={handleVoiceMessage}
      />
    </div>
  );
}