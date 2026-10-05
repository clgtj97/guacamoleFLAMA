// RacerApp.tsx - COMPLETE REVISED WITH SMOOTH TRANSITIONS
import React, { useState, useEffect, useCallback } from 'react';
import PistaGame from './PistaGame';
import TrackBuilder from './TrackBuilder';
import Lottie from 'lottie-react';
import racingFlagAnimation from './assets/chequered-flag.json';
import ThreeJSBackground from './threeJSBackground';
import spriteDefault from './assets/DogKart.gif';
import './gameOne.css';

// Import font files
import BebasNeueTTF from './assets/Bebas_Neue/BebasNeue-Regular.ttf';
import SixtyfourTTF from './assets/Sixtyfour/Sixtyfour-Regular-VariableFont_BLED,SCAN.ttf';
import ZalandoSansTTF from './assets/Zalando_Sans_SemiExpanded/ZalandoSansSemiExpanded-VariableFont_wght.ttf';

// Interfaces
interface TrackSegment {
  worldX: number;
  worldY: number;
  worldZ: number;
  curve: number;
  hill: number;
  bank: number;
  friction: number;
  sprite: number;
  width: number;
}

interface RacerAppProps {
  onClose?: () => void;
  importedTrack?: TrackSegment[];
}

type AppMode = 'intro' | 'menu' | 'builder' | 'racing';

// Constants
const DEFAULT_TRACK: TrackSegment[] = [
  { worldX: 0, worldY: 0, worldZ: 0, curve: 0, hill: 0, bank: 0, friction: 1, sprite: 0, width: 20 },
  { worldX: 100, worldY: 0, worldZ: 0, curve: 0.1, hill: 0.05, bank: 0, friction: 1, sprite: 1, width: 20 },
  { worldX: 200, worldY: 10, worldZ: 5, curve: 0.2, hill: 0.1, bank: 0.1, friction: 1, sprite: 2, width: 18 },
  { worldX: 300, worldY: 20, worldZ: 10, curve: -0.1, hill: 0.05, bank: -0.1, friction: 1, sprite: 3, width: 22 },
];

export default function RacerApp({ onClose, importedTrack }: RacerAppProps) {
  // State
  const [currentMode, setCurrentMode] = useState<AppMode>('intro');
  const [currentTrack, setCurrentTrack] = useState<TrackSegment[] | null>(null);
  const [builtTracks, setBuiltTracks] = useState<TrackSegment[][]>([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [gifVersion, setGifVersion] = useState(0);
  const [showGameText, setShowGameText] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Memoized handlers
  const handleAnimationComplete = useCallback(() => {
    setIntroComplete(true);
    setTimeout(() => setCurrentMode('menu'), 1000);
  }, []);

  const handleTrackBuilt = useCallback((trackSegments: TrackSegment[]) => {
    setCurrentTrack(trackSegments);
    setBuiltTracks(prev => [...prev, trackSegments]);
    setCurrentMode('racing');
  }, []);

  const handleGameClose = useCallback(() => {
    setCurrentMode('menu');
    setShowMenuOptions(true);
    onClose?.();
  }, [onClose]);

  const handleReturnToBuilder = useCallback(() => {
    setCurrentMode('builder');
  }, []);

  const handleStateUpdate = useCallback((state: { heading: number; speed: number }) => {
    console.log("Game state update:", state);
  }, []);

  const handleDefaultTrack = useCallback(() => {
    setCurrentTrack(DEFAULT_TRACK);
    setCurrentMode('racing');
  }, []);

  const handleUseImportedTrack = useCallback(() => {
    if (importedTrack?.length) {
      setCurrentTrack(importedTrack);
      setCurrentMode('racing');
    }
  }, [importedTrack]);

  const handleLoadTrack = useCallback((track: TrackSegment[]) => {
    setCurrentTrack(track);
    setCurrentMode('racing');
  }, []);

  const handleStartClick = useCallback(() => {
    setIsTransitioning(true);
    
    // Fade out ALL current content
    setTimeout(() => {
      // Reset everything to hidden state
      setShowGameText(false);
      setShowMenuOptions(false);
      
      // Fade in everything fresh
      setTimeout(() => {
        setShowGameText(true);
        setShowMenuOptions(true);
        setIsTransitioning(false);
      }, 300);
    }, 300);
  }, []);

  // Effects
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

  // GIF looping effect
  useEffect(() => {
    if (showMenuOptions) {
      const interval = setInterval(() => {
        setGifVersion(prev => prev + 1);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showMenuOptions]);

  // Loading state
  if (!fontsLoaded) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl mb-4">Loading...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ==================== COMPONENTS ====================

  const MenuButton = ({ 
    children, 
    onClick, 
    color = 'gray',
    className = '' 
  }: { 
    children: React.ReactNode; 
    onClick: () => void;
    color?: 'red' | 'green' | 'blue' | 'purple' | 'gray';
    className?: string;
  }) => {
    const colorClasses = {
      red: 'from-red-600/20 to-red-700/20 group-hover:from-red-600/30 group-hover:to-red-700/30',
      green: 'from-green-600/20 to-green-700/20 group-hover:from-green-600/30 group-hover:to-green-700/30',
      blue: 'from-blue-600/20 to-blue-700/20 group-hover:from-blue-600/30 group-hover:to-blue-700/30',
      purple: 'from-purple-600/20 to-purple-700/20 group-hover:from-purple-600/30 group-hover:to-purple-700/30',
      gray: 'from-gray-600/20 to-gray-700/20 group-hover:from-gray-600/30 group-hover:to-gray-700/30'
    };

    return (
      <button
        onClick={onClick}
        className={`w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border border-white/20 hover:border-white/30 relative overflow-hidden group ${className}`}
        style={{ fontFamily: 'Sixtyfour, monospace' }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} rounded-xl transition-all duration-300`} />
        <span className="relative z-10">{children}</span>
      </button>
    );
  };

  const KartDisplayCard = () => (
    <div className="bg-gray-900/70 rounded-2xl p-4 pt-2 shadow-2xl border border-gray-700/30">
      {/* Main Content - No top padding */}
      <div className="flex items-stretch justify-between">
        {/* Left Text - Even tighter */}
        <div className="text-left w-1/3 flex flex-col justify-center">
          <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Sixtyfour, monospace' }}>
            🏎️<br />YOUR KART
          </h2>
          <p className="text-white text-[0.75rem] mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            Ready to race!
          </p>
          <p className="text-white text-[0.75rem]" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            Bc1....<br />
            1/5 RACER'S
          </p>
        </div>
  
        {/* Center GIF - Even tighter spacing */}
        <div className="relative flex items-center justify-center px-1">
          <div className="relative">
            {/* F1 Trophy Pedestal - Moved up closer */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full shadow-xl" />
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full shadow-lg" />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-7 h-7 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white font-black text-xs" style={{ fontFamily: 'Sixtyfour, monospace' }}>1</span>
            </div>
            {/* Kart GIF */}
            <img 
              key={gifVersion}
              src={`${spriteDefault}?v=${gifVersion}`}
              alt="Racing Kart"
              className="w-28 h-28 object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
  
        {/* Right Text - Even tighter */}
        <div className="text-right w-1/3 flex flex-col justify-center">
          <h3 className="text-md font-bold text-white mb-1" style={{ fontFamily: 'Sixtyfour, monospace' }}>
            STATS
          </h3>
          <p className="text-white text-[0.75rem] mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            SPEED: 98
          </p>
          <p className="text-white text-[0.75rem] mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            GRIP: 95
          </p>
          <p className="text-white text-[0.75rem] font-bold" style={{ fontFamily: 'Sixtyfour, monospace' }}>
            RANK: #1
          </p>
        </div>
      </div>
  
      {/* Lower Status Bar - Reduced top padding */}
      <div className="flex justify-between items-start pt-2 border-t border-gray-700/30 mt-1">
        <div className="text-left flex-1">
          <p className="text-[0.7rem] text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            Tire in Use
          </p>
          <p className="text-[0.75rem] font-bold text-white" style={{ fontFamily: 'Sixtyfour, monospace' }}>
            Pirelli Pista
          </p>
        </div>
        
        <div className="text-center flex-1">
          <p className="text-[0.7rem] text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            Tire Life
          </p>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
            </div>
            <span className="text-[0.7rem] font-bold text-white" style={{ fontFamily: 'Sixtyfour, monospace' }}>85%</span>
          </div>
        </div>
  
        <div className="text-center flex-1">
          <p className="text-[0.7rem] text-white uppercase tracking-wide mb-0.5" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
            Car Health
          </p>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }} />
            </div>
            <span className="text-[0.7rem] font-bold text-white" style={{ fontFamily: 'Sixtyfour, monospace' }}>92%</span>
          </div>
        </div>
      </div>
  
      {/* Cost Warning - Smaller and tighter */}
      <div className="mt-2 p-1.5 bg-gray-800/40 rounded-lg border border-gray-700/30">
        <p className="text-[0.65rem] text-white text-center" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
          ⚠️ Next race costs: Tire wear + potential repairs
        </p>
      </div>
    </div>
  );

  const PreviousTracksCard = () => (
    <div className="mt-6 bg-amber-50/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-amber-200/50">
      <h3 className="text-lg font-black text-gray-800 mb-4 text-center" style={{ fontFamily: 'Sixtyfour, monospace' }}>
        📊 PREVIOUS TRACKS
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {builtTracks.map((track, index) => (
          <button
            key={index}
            onClick={() => handleLoadTrack(track)}
            className="bg-white/60 hover:bg-white/80 backdrop-blur-sm text-gray-800 p-3 rounded-lg transition-all duration-300 transform hover:scale-105 border border-amber-200 hover:border-amber-300 text-center group"
            style={{ fontFamily: 'Zalando Sans SemiExpanded' }}
          >
            <div className="font-bold text-sm mb-1" style={{ fontFamily: 'Sixtyfour, monospace' }}>
              TRACK {index + 1}
            </div>
            <div className="text-xs text-gray-600">
              {track.length} segments
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ==================== RENDER METHODS ====================

  const renderIntro = () => (
    <div className="w-full min-h-screen relative overflow-hidden">
      <ThreeJSBackground mode="intro" onAnimationComplete={handleAnimationComplete} />
    </div>
  );

  const renderMenu = () => (
    <div className="w-full min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <ThreeJSBackground mode="background" />
      </div>
      <div className="absolute inset-0 bg-black/20 -z-5" />
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl w-full">
        
        {/* Left Side - Actions */}
        <div className="flex flex-col items-center gap-6 w-full lg:w-1/2 max-w-md">
          {/* ALL left content wrapped in single transition */}
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* Title Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10">
                  <Lottie animationData={racingFlagAnimation} loop={true} autoplay={true} />
                </div>
                <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Sixtyfour, monospace' }}>
                  FERRARI<br />
                  <span className="text-xl">MINIkart's</span>
                </h1>
              </div>
              
              {/* Game Text - Shows after transition */}
              {showGameText && (
                <div className="space-y-3">
                  <p className="text-white text-lg font-bold" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
                    Build & race in Ferrari style!
                  </p>
                  <div className="space-y-2">
                    <p className="text-white/80 text-sm" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
                      (Build your track. Dominate the race.)
                    </p>
                    <p className="text-white/80 text-sm" style={{ fontFamily: 'Zalando Sans SemiExpanded' }}>
                      Then hit the shop.<br />
                      Max your ride.<br />
                      Lock in the grip. Go show 'em. 🏁
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Button Section */}
            {!showMenuOptions ? (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleStartClick}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl border-2 border-red-400/50 hover:border-red-300 relative overflow-hidden group w-48"
                  style={{ fontFamily: 'Sixtyfour, monospace' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 group-hover:from-red-500 group-hover:to-red-600 rounded-xl transition-all duration-300" />
                  <span className="relative z-10 text-base">START RACING</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                <MenuButton onClick={handleDefaultTrack} color="green">
                  🏁 DEFAULT TRACK
                </MenuButton>

                <MenuButton onClick={() => setCurrentMode('builder')} color="blue">
                  🛠️ BUILD TRACK
                </MenuButton>

                {importedTrack?.length && (
                  <MenuButton onClick={handleUseImportedTrack} color="purple">
                    📁 IMPORTED TRACK
                  </MenuButton>
                )}

                {onClose && (
                  <MenuButton onClick={onClose} color="red" className="mt-4 py-3">
                    CLOSE RACER
                  </MenuButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Display */}
        {showMenuOptions && (
          <div className={`w-full lg:w-1/2 max-w-md transition-all duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <KartDisplayCard />
            {builtTracks.length > 0 && <PreviousTracksCard />}
          </div>
        )}
      </div>
    </div>
  );

  const renderBuilder = () => (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <ThreeJSBackground mode="background" />
      </div>
      
      <TrackBuilder onBuild={handleTrackBuilt} builtTrack={currentTrack} />
      
      <div className="p-4 bg-gradient-to-r from-red-700/80 to-gray-800/80 border-t border-red-500/50 text-center backdrop-blur-sm">
        <button
          onClick={() => setCurrentMode('menu')}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-white hover:to-red-100 text-white hover:text-red-700 font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border border-red-500/50 hover:border-red-300"
          style={{ fontFamily: 'Sixtyfour, monospace' }}
        >
          ← BACK TO MENU
        </button>
      </div>
    </div>
  );

  const renderRacing = () => (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 -z-10">
        <ThreeJSBackground mode="background" />
      </div>
      
      <PistaGame 
        onClose={handleGameClose}
        onStateUpdate={handleStateUpdate}
        importedTrack={currentTrack || importedTrack}
      />
      
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={handleReturnToBuilder}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-white hover:to-red-100 text-white hover:text-red-700 font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border border-red-500/50 hover:border-red-300 backdrop-blur-sm"
          style={{ fontFamily: 'Sixtyfour, monospace' }}
        >
          🛠️ EDIT TRACK
        </button>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className="w-full h-full">
      {currentMode === 'intro' && renderIntro()}
      {currentMode === 'menu' && renderMenu()}
      {currentMode === 'builder' && renderBuilder()}
      {currentMode === 'racing' && renderRacing()}
    </div>
  );
}