// app/gameOne/ColosseumGame.tsx - STANDALONE MOCK (no colyseus, no custom hooks)
import React, { useState, useEffect } from "react";
import { Sword, Shield, Zap, Trophy, Clock, X, Swords } from "lucide-react";

interface ColosseumGameProps {
  playerName: string;
  onExit: () => void;
}

export default function ColosseumGame({ playerName, onExit }: ColosseumGameProps) {
  const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "finished">("waiting");
  const [matchTime, setMatchTime] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  
  // Auto-start game after 3 seconds
  useEffect(() => {
    if (gameStatus === "waiting") {
      const timer = setTimeout(() => setGameStatus("playing"), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);
  
  // Game timer
  useEffect(() => {
    if (gameStatus === "playing") {
      const timer = setInterval(() => {
        setMatchTime(prev => {
          if (prev >= 300) {
            setGameStatus("finished");
            return prev;
          }
          return prev + 1;
        });
        
        // Random scoring for demo
        if (Math.random() > 0.7) {
          Math.random() > 0.5 ? setRedScore(s => s + 1) : setBlueScore(s => s + 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 border-b border-purple-500/30">
        <div className="flex items-center gap-4">
          <Swords className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
              COLOSSEUM ARENA
            </h1>
            <p className="text-xs text-gray-500">{gameStatus.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-red-400">{redScore}</span>
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          
          <div className="px-4 py-2 bg-black/30 rounded-lg border border-purple-500/20">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="font-mono text-lg">
              {Math.floor(matchTime / 60)}:{(matchTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-2xl font-bold text-blue-400">{blueScore}</span>
          </div>
        </div>
        
        <button 
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-sm transition-all"
        >
          <X className="w-4 h-4" />
          LEAVE ARENA
        </button>
      </div>
      
      {/* Arena */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Sand floor gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-amber-800/10 to-amber-900/20" />
        
        {/* Center circle */}
        <div className="absolute w-40 h-40 rounded-full border-2 border-purple-500/20" />
        <div className="absolute w-60 h-60 rounded-full border border-purple-500/10" />
        
        {/* Center line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-purple-500/20" />
        
        {/* Status overlay */}
        {gameStatus === "waiting" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="text-center">
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl font-bold mb-4">AWAITING GLADIATORS</h2>
              <p className="text-xl text-gray-400 mb-8">Preparing the arena...</p>
              <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-red-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        {gameStatus === "playing" && (
          <>
            {/* Player markers */}
            <div className="absolute left-[15%] top-[35%] text-center">
              <div className="w-16 h-16 bg-red-500/40 border-3 border-red-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg shadow-red-500/20">
                {playerName[0]}
              </div>
              <div className="text-xs mt-2 font-bold text-red-300">{playerName}</div>
              <div className="w-12 h-1.5 bg-gray-700 rounded-full mt-1 mx-auto overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            
            <div className="absolute right-[15%] top-[45%] text-center">
              <div className="w-16 h-16 bg-blue-500/40 border-3 border-blue-500 rounded-full flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/20">
                G
              </div>
              <div className="text-xs mt-2 font-bold text-blue-300">Gladiator</div>
              <div className="w-12 h-1.5 bg-gray-700 rounded-full mt-1 mx-auto overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            
            <div className="absolute left-[40%] top-[55%] text-center">
              <div className="w-14 h-14 bg-red-500/30 border-2 border-red-500 rounded-full flex items-center justify-center text-base font-bold">
                M
              </div>
              <div className="text-xs mt-1 text-red-300">Maximus</div>
              <div className="w-10 h-1 bg-gray-700 rounded-full mt-1 mx-auto overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            
            <div className="absolute right-[35%] top-[30%] text-center">
              <div className="w-14 h-14 bg-blue-500/30 border-2 border-blue-500 rounded-full flex items-center justify-center text-base font-bold">
                S
              </div>
              <div className="text-xs mt-1 text-blue-300">Spartacus</div>
              <div className="w-10 h-1 bg-gray-700 rounded-full mt-1 mx-auto overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
            
            {/* Power-up spawn */}
            <div className="absolute left-[50%] top-[20%]">
              <div className="w-8 h-8 bg-green-500/40 border-2 border-green-500 rounded-full animate-pulse" />
            </div>
            <div className="absolute right-[25%] top-[65%]">
              <div className="w-8 h-8 bg-yellow-500/40 border-2 border-yellow-500 rounded-full animate-pulse" />
            </div>
          </>
        )}
        
        {gameStatus === "finished" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="text-center">
              <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-5xl font-bold mb-4">
                {redScore > blueScore ? (
                  <span className="text-red-400">RED TEAM VICTORY!</span>
                ) : blueScore > redScore ? (
                  <span className="text-blue-400">BLUE TEAM VICTORY!</span>
                ) : (
                  <span className="text-yellow-400">DRAW!</span>
                )}
              </h2>
              <p className="text-2xl text-gray-300 mb-8">{redScore} - {blueScore}</p>
              <button 
                onClick={onExit}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-red-600 text-white font-bold text-lg rounded-xl hover:from-purple-500 hover:to-red-500 transition-all shadow-lg"
              >
                RETURN TO LOUNGE
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom HUD */}
      <div className="h-20 bg-black/50 border-t border-purple-500/30 flex items-center justify-between px-6">
        <div className="text-sm">
          <div className="text-gray-500">Gladiator</div>
          <div className="font-bold text-purple-300">{playerName}</div>
        </div>
        
        <div className="flex gap-3">
          <button className="w-12 h-12 bg-blue-600/20 hover:bg-blue-600/40 rounded-xl flex items-center justify-center border border-blue-500/30 transition-all">
            <Shield className="w-6 h-6 text-blue-400" />
          </button>
          <button className="w-12 h-12 bg-green-600/20 hover:bg-green-600/40 rounded-xl flex items-center justify-center border border-green-500/30 transition-all">
            <Zap className="w-6 h-6 text-green-400" />
          </button>
          <button className="w-12 h-12 bg-red-600/20 hover:bg-red-600/40 rounded-xl flex items-center justify-center border border-red-500/30 transition-all">
            <Sword className="w-6 h-6 text-red-400" />
          </button>
        </div>
        
        <div className="text-xs text-gray-600">
          WASD: Move • SPACE: Attack • Q/E/R: Abilities
        </div>
      </div>
    </div>
  );
}