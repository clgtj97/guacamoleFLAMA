// gameOneMobile.tsx - COMPLETE MOBILE ADAPTER
import React, { useState, useEffect, useRef } from 'react';
import spriteSheet from './assets/sprite-sheet-3.png';  // ← ADD THIS
import VirtualChat from './components/VirtualChat';
import RacerApp from './RacerApp';
import {
  MessageSquare, ChevronDown, ChevronUp, Pin, PinOff,
  Users, Car, Flag, Gem, ShoppingBag, Bitcoin, X, ArrowUpRight
} from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
// Add SPRITE_CONFIG if not importing from shared file
const SPRITE_CONFIG = {
  frameWidth: 258,
  frameHeight: 256, 
  displayScale: 0.405,
};

// ──────────────────────────────────────────────
// TYPE DEFINITIONS (shared with web)
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

// ──────────────────────────────────────────────
// PLACEHOLDER PANELS (for chat tabs)
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
// GAME ACTIVATION PROMPT
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
            <h3 className="text-xl font-black text-white mb-2 tracking-wider leading-tight"
             style={{ fontFamily: 'Sixtyfour', letterSpacing: '0.05em' }}
            >
              FERRARI RACING CHALLENGE
            </h3>
            <p className="text-gray-200 text-xs font-medium tracking-wide"
              style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}
            >
              Ready to test your skills on the track?
            </p>
          </div>
          
          <div className="flex flex-col space-y-3 items-center">
            <button
              onClick={onStartGame}
              className="bg-gradient-to-r from-white to-gray-200 text-red-700 font-bold py-3 px-6 rounded-xl hover:from-gray-100 hover:to-gray-300 transition-all duration-200 text-sm tracking-wider shadow-lg hover:shadow-white/25 w-full border border-white"
              style={{ fontFamily: 'Sixtyfour', letterSpacing: '0.05em' }}
            >
              START RACING
            </button>
            
            <button
              onClick={onContinueWalking}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 px-6 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-200 border border-gray-500 text-xs shadow-lg hover:shadow-gray-500/10 w-full"
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
// MOBILE CHAT OVERLAY (simplified for mobile)
// ──────────────────────────────────────────────
function MobileChatOverlay({
  chatMinimized,
  setChatMinimized,
  autoScroll,
  setAutoScroll,
  chatContainerRef,
  onScroll,
  currentUser,
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
  onMessageSend: (message: string) => void;
  onMessageReact: (messageId: string, emoji: string) => void;
  onMessagePin: (messageId: string) => void;
  onVoiceMessage: (audioBlob: Blob) => Promise<string>;
}) {
  const [activePanel, setActivePanel] = React.useState<'chat' | 'pokedex' | 'friends' | 'btc'>('chat');

  if (chatMinimized) {
    return (
      <button
        onClick={() => setChatMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-700/80 backdrop-blur-xl border border-red-500/50 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
      </button>
    );
  }

  const tabs = [
    { id: 'chat' as const, icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'CHAT' },
    { id: 'pokedex' as const, icon: <span className="text-[11px]">⚡</span>, label: 'DECK' },
    { id: 'friends' as const, icon: <span className="text-[11px]">👥</span>, label: 'FRIENDS' },
    { id: 'btc' as const, icon: <span className="text-[11px]">₿</span>, label: 'BTC' },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ maxHeight: '60vh', boxShadow: '0 0 40px rgba(255,0,0,0.15)' }}>

      {/* Tab Bar */}
      <div className="flex items-center border-b border-white/10 bg-black/40">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold tracking-wider transition-all ${
              activePanel === tab.id
                ? 'text-white border-b-2 border-red-500 bg-red-500/10'
                : 'text-gray-500 border-b-2 border-transparent'
            }`}
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 px-3">
          {activePanel === 'chat' && (
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg transition-colors ${autoScroll ? 'text-green-400 bg-green-500/10' : 'text-gray-500'}`}
            >
              {autoScroll ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => setChatMinimized(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-80 w-full">
        {activePanel === 'chat' && (
          <VirtualChat
            roomId="ferrari-global-chat"
            currentUser={currentUser}
            height={320}
            onMessageSend={onMessageSend}
            onMessageReact={onMessageReact}
            onMessagePin={onMessagePin}
            onVoiceMessage={onVoiceMessage}
            disableAutoScroll={!autoScroll}
            containerRef={chatContainerRef}
            onScroll={onScroll}
          />
        )}

        {activePanel === 'pokedex' && (
          <PlaceholderPanel 
            icon="⚡" 
            title="GAME DECK" 
            desc="Collect, trade, and battle with your Ferrari racing cards."
            color="purple" 
          />
        )}

        {activePanel === 'friends' && (
          <PlaceholderPanel 
            icon="👥" 
            title="FRIENDS & ROOMS" 
            desc="Add friends and see which rooms they are in."
            color="blue" 
          />
        )}

        {activePanel === 'btc' && (
          <PlaceholderPanel 
            icon="₿" 
            title="INSTANT BTC" 
            desc="Send BTC on the fly — tip a friend or pay an entry fee."
            color="yellow" 
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MOBILE COMMAND BAR (icon row)
// ──────────────────────────────────────────────
function MobileCommandBar({ onOpenModal, onCloseModal, activeModal }: { 
  onOpenModal: (command: string) => void;
  onCloseModal: () => void;
  activeModal: string | null;
}) {
  const commands = [
    { id: 'garage', icon: Car },
    { id: 'races',  icon: Flag },
    { id: 'nft',    icon: Gem },
    { id: 'social', icon: Users },
    { id: 'shop',   icon: ShoppingBag },
    { id: 'btc',    icon: Bitcoin },
  ];

  return (
    <>
      <div className="flex items-center justify-center gap-4 py-2 px-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-b-xl">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.id}
              onClick={() => activeModal === cmd.id ? onCloseModal() : onOpenModal(cmd.id)}
              className={`w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center transition-all duration-200 ${
                activeModal === cmd.id 
                  ? 'bg-red-500/30 border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.3)]' 
                  : 'bg-white/5 hover:bg-red-500/20'
              }`}
            >
              <Icon className="w-4 h-4 text-white/80" />
            </button>
          );
        })}
      </div>

      {/* Command Modal */}
      {activeModal && (
        <div className="mx-4 mb-3 p-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
              {activeModal.toUpperCase()}
            </h3>
            <button onClick={onCloseModal} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-400 text-xs">
            {activeModal === 'garage' && 'Browse your collected Ferraris and select your ride.'}
            {activeModal === 'races' && 'Join live events and check leaderboards.'}
            {activeModal === 'nft' && 'Exclusive Ferrari digital collectibles.'}
            {activeModal === 'social' && 'Manage contacts and challenge rivals.'}
            {activeModal === 'shop' && 'Performance parts and limited merch.'}
            {activeModal === 'btc' && 'Send & receive BTC instantly.'}
          </p>
          <div className="mt-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center" style={{ fontFamily: 'Bebas Neue' }}>
            COMING SOON
          </div>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// MOBILE CONTROLS (D-Pad style)
// ──────────────────────────────────────────────
function MobileControls({
  onDirectionChange,
  onDirectionRelease,
  onVerticalChange,
  onVerticalRelease
}: {
  onDirectionChange: (dir: 'left' | 'right') => void;
  onDirectionRelease: (dir: 'left' | 'right') => void;
  onVerticalChange: (dir: 'up' | 'down') => void;
  onVerticalRelease: (dir: 'up' | 'down') => void;
}) {
  return (
    <div className="absolute bottom-20 left-4 z-30">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-1">
        {/* Up */}
        <div className="col-start-2">
          <button
            className="w-12 h-12 bg-red-700/60 hover:bg-red-600/80 rounded-t-xl flex items-center justify-center text-white text-lg font-bold active:scale-95 transition-all border border-red-500/30"
            onTouchStart={(e) => { e.preventDefault(); onVerticalChange('up'); }}
            onTouchEnd={(e) => { e.preventDefault(); onVerticalRelease('up'); }}
            onMouseDown={() => onVerticalChange('up')}
            onMouseUp={() => onVerticalRelease('up')}
            onMouseLeave={() => onVerticalRelease('up')}
          >
            ▲
          </button>
        </div>

        {/* Left - Center - Right */}
        <button
          className="w-12 h-12 bg-red-700/60 hover:bg-red-600/80 rounded-l-xl flex items-center justify-center text-white text-lg font-bold active:scale-95 transition-all border border-red-500/30"
          onTouchStart={(e) => { e.preventDefault(); onDirectionChange('left'); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirectionRelease('left'); }}
          onMouseDown={() => onDirectionChange('left')}
          onMouseUp={() => onDirectionRelease('left')}
          onMouseLeave={() => onDirectionRelease('left')}
        >
          ◄
        </button>
        <div className="w-12 h-12 bg-red-700/20 flex items-center justify-center rounded border border-red-500/10">
          <span className="text-[8px] text-gray-500" style={{ fontFamily: 'Bebas Neue' }}>MOVE</span>
        </div>
        <button
          className="w-12 h-12 bg-red-700/60 hover:bg-red-600/80 rounded-r-xl flex items-center justify-center text-white text-lg font-bold active:scale-95 transition-all border border-red-500/30"
          onTouchStart={(e) => { e.preventDefault(); onDirectionChange('right'); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirectionRelease('right'); }}
          onMouseDown={() => onDirectionChange('right')}
          onMouseUp={() => onDirectionRelease('right')}
          onMouseLeave={() => onDirectionRelease('right')}
        >
          ►
        </button>

        {/* Down */}
        <div className="col-start-2">
          <button
            className="w-12 h-12 bg-red-700/60 hover:bg-red-600/80 rounded-b-xl flex items-center justify-center text-white text-lg font-bold active:scale-95 transition-all border border-red-500/30"
            onTouchStart={(e) => { e.preventDefault(); onVerticalChange('down'); }}
            onTouchEnd={(e) => { e.preventDefault(); onVerticalRelease('down'); }}
            onMouseDown={() => onVerticalChange('down')}
            onMouseUp={() => onVerticalRelease('down')}
            onMouseLeave={() => onVerticalRelease('down')}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// GAME AREA (mobile-optimized, renders web sprites)
// ──────────────────────────────────────────────
function MobileGameArea({
  gameAreaRef,
  displayBackground,
  gameLogic,
  verticalPosition,
  transitionOpacity,
  currentFrame,
  position,
  direction,
  isTransitioning,
  spriteSheet,
  SPRITE_CONFIG
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
  spriteSheet: string;
  SPRITE_CONFIG: any;
}) {
  const { frameWidth, frameHeight, displayScale } = SPRITE_CONFIG;
  const TOTAL_FRAMES = 12;
  
  const visualW = Math.round(frameWidth * displayScale);
  const visualH = Math.round(frameHeight * displayScale);
  const footTrim = Math.round(frameHeight * displayScale * 0.05);
  const croppedH = visualH - footTrim;
  const scaledSheetW = Math.round(frameWidth * TOTAL_FRAMES * displayScale);
  const scaledFrameOffsetX = Math.round(currentFrame * frameWidth * displayScale);

  return (
    <div className="w-full h-full flex items-center justify-center min-h-0">
      <div
        ref={gameAreaRef}
        className="relative overflow-hidden rounded-xl border border-red-500/20 shadow-lg w-full"
        style={{
          aspectRatio: '16/9',
          boxShadow: '0 0 40px rgba(255,0,0,0.1), inset 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Background */}
        <img
          src={displayBackground}
          alt="Room"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Character Sprite */}
        <div
          className="absolute z-20"
          style={{
            left: `${Math.round(position)}px`,
            bottom: `${Math.round(verticalPosition)}px`,
            width: `${visualW}px`,
            height: `${croppedH}px`,
            overflow: 'hidden',
            transform: direction === 'left' ? 'scaleX(-1)' : 'none',
            transformOrigin: 'bottom center',
            marginLeft: `-${Math.round(visualW / 2)}px`,
            backgroundImage: `url(${spriteSheet})`,
            backgroundPosition: `-${scaledFrameOffsetX}px ${-footTrim}px`,
            backgroundSize: `${scaledSheetW}px ${visualH}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            pointerEvents: 'none',
          }}
        />

        {/* Transition overlay */}
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
// MAIN MOBILE COMPONENT
// ──────────────────────────────────────────────
interface GameOneMobileProps {
  gameLogic: any;
  playAnimation: (animation: string) => void;
}

export default function GameOneMobile({ gameLogic, playAnimation }: GameOneMobileProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMinimized, setChatMinimized] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [commandModal, setCommandModal] = useState<string | null>(null);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [currentUser] = useState<ChatUser>({
    id: 'player-' + Math.random().toString(36).substr(2, 9),
    name: 'Ferrari Fan',
    isClubMember: true,
    isOnline: true
  });

  // Safety check - wait for gameLogic to be ready
  if (!gameLogic || !gameLogic.currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-center">
          <div className="text-2xl font-['Zalando Sans SemiExpanded'] mb-4">Loading...</div>
          <div className="text-6xl animate-pulse">🏎️</div>
        </div>
      </div>
    );
  }

 if (gameLogic.showRacerApp) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-900 to-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>
      <div className="w-full max-w-7xl relative z-10">
        <MemoryRouter>
          <RacerApp onClose={gameLogic.closeRacerApp} />
        </MemoryRouter>
      </div>
    </div>
  );
}

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (gameAreaRef.current && gameLogic.setGameSize) {
        const container = gameAreaRef.current.getBoundingClientRect();
        gameLogic.setGameSize({
          width: Math.floor(container.width),
          height: Math.floor(container.height)
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

  // Seed chat messages
  useEffect(() => {
    setChatMessages([
      {
        id: '1',
        user: { id: 'ferrari-official', name: 'Ferrari Official', isClubMember: true },
        content: 'Welcome to Ferrari Chat! 🏎️ Start your engines!',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
        reactions: [
          { emoji: '❤️', users: [currentUser], count: 1 },
          { emoji: '🏎️', users: [], count: 3 }
        ],
        isPinned: true,
        pinnedBy: { id: 'ferrari-official', name: 'Ferrari Official' },
        pinnedAt: new Date(Date.now() - 3500000)
      },
      {
        id: '2',
        user: { id: 'enzo-racer', name: 'Enzo Racer', isClubMember: true },
        content: 'Just completed the Pista challenge! 🚀',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text',
        reactions: [
          { emoji: '🔥', users: [], count: 2 },
          { emoji: '👏', users: [currentUser], count: 1 }
        ]
      }
    ]);
  }, [currentUser]);

  // Auto-scroll chat
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

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: currentUser,
      content: message,
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
      setTimeout(() => resolve(voiceUrl), 1000);
    });
  };

  const handleStartGame = () => {
    gameLogic.openRacerApp?.();
  };

  const handleContinueWalking = () => {
    gameLogic.handleContinueWalking?.();
  };

  // Transition helpers
  const getTransitionOpacity = (progress: number) => {
    if (progress < 0.4) return progress / 0.4;
    if (progress < 0.6) return 1;
    return 1 - ((progress - 0.6) / 0.4);
  };

  const getDisplayBackground = (progress: number, nextIdx: number | null, currentRoom: any, rooms: any[]) => {
    return progress >= 0.5
      ? (nextIdx !== null ? rooms[nextIdx].background : currentRoom.background)
      : currentRoom.background;
  };

  const transitionOpacity = getTransitionOpacity(gameLogic.transitionProgress ?? 0);
  const displayBackground = getDisplayBackground(
    gameLogic.transitionProgress ?? 0,
    gameLogic.nextRoomIndex ?? null,
    gameLogic.currentRoom,
    []
  );

  // For background, use current room's background directly from gameLogic
  const currentBg = gameLogic.currentRoom?.background || '';

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>

      <GameActivationPrompt
        isVisible={gameLogic.showGamePrompt || false}
        onStartGame={handleStartGame}
        onContinueWalking={handleContinueWalking}
      />

      {/* Room Header */}
      <div className="px-4 pt-3 pb-1">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-2 border border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="text-white text-xs font-medium tracking-wider" style={{ fontFamily: 'Bebas Neue' }}>
                {gameLogic.currentRoom?.name || 'Ferrari Showroom'}
              </h3>
            </div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'Bebas Neue' }}>
              Room {((gameLogic.currentRoomIndex ?? 0) + 1)}/5
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 px-4 py-1 relative">
        <MobileGameArea
          gameAreaRef={gameAreaRef}
          displayBackground={currentBg}
          gameLogic={gameLogic}
          verticalPosition={gameLogic.verticalPosition ?? 0}
          transitionOpacity={transitionOpacity}
          currentFrame={gameLogic.currentFrame ?? 0}
          position={gameLogic.position ?? 0}
          direction={gameLogic.direction ?? 'right'}
          isTransitioning={gameLogic.isTransitioning ?? false}
          spriteSheet={spriteSheet}
          SPRITE_CONFIG={SPRITE_CONFIG}
        />

        {/* Mobile D-Pad Controls */}
        <MobileControls
          onDirectionChange={(dir) => {
            gameLogic.setKeysPressed?.((prev: any) => ({ ...prev, [dir]: true }));
            gameLogic.setDirection?.(dir);
          }}
          onDirectionRelease={(dir) => {
            gameLogic.setKeysPressed?.((prev: any) => ({ ...prev, [dir]: false }));
          }}
          onVerticalChange={(dir) => {
            gameLogic.setKeysPressed?.((prev: any) => ({ ...prev, [dir]: true }));
          }}
          onVerticalRelease={(dir) => {
            gameLogic.setKeysPressed?.((prev: any) => ({ ...prev, [dir]: false }));
          }}
        />
      </div>

      {/* Command Bar */}
      <div className="px-4">
        <MobileCommandBar
          onOpenModal={(cmd) => setCommandModal(cmd)}
          onCloseModal={() => setCommandModal(null)}
          activeModal={commandModal}
        />
      </div>

      {/* Floating Chat Button / Overlay */}
      <MobileChatOverlay
        chatMinimized={chatMinimized}
        setChatMinimized={setChatMinimized}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        chatContainerRef={chatContainerRef}
        onScroll={handleChatScroll}
        currentUser={currentUser}
        onMessageSend={handleSendMessage}
        onMessageReact={handleMessageReact}
        onMessagePin={handleMessagePin}
        onVoiceMessage={handleVoiceMessage}
      />
    </div>
  );
}