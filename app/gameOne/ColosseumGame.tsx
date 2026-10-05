// app/gameOne/ColosseumGame.tsx - LIVE COLOSSEUM ROOM TESTER
import React, { useEffect, useMemo, useState } from "react";
import { Sword, Shield, Zap, Trophy, Clock, X, Swords, Wifi, WifiOff } from "lucide-react";
import { useColosseumMultiplayer } from "./hooks/useColosseumMultiplayer";

interface ColosseumGameProps {
  playerName: string;
  onExit: () => void;
}

export default function ColosseumGame({ playerName, onExit }: ColosseumGameProps) {
  const [localX, setLocalX] = useState(100);
  const [localY, setLocalY] = useState(300);

  const {
    connected,
    connectionError,
    gameState,
    players,
    myPlayer,
    sendMovement,
    sendAttack,
  } = useColosseumMultiplayer(playerName);

  const gameStatus = (gameState.gameStatus || "waiting") as "waiting" | "countdown" | "playing" | "finished";
  const matchTime = Math.floor(gameState.matchTime || 0);
  const redScore = gameState.redScore || 0;
  const blueScore = gameState.blueScore || 0;

  const arenaPlayers = useMemo(() => Array.from(players.values()), [players]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 22 : 12;
      let nextX = localX;
      let nextY = localY;

      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          nextX -= step;
          break;
        case 'ArrowRight':
        case 'KeyD':
          nextX += step;
          break;
        case 'ArrowUp':
        case 'KeyW':
          nextY -= step;
          break;
        case 'ArrowDown':
        case 'KeyS':
          nextY += step;
          break;
        case 'Space':
          event.preventDefault();
          sendAttack('melee');
          return;
        default:
          return;
      }

      nextX = Math.max(0, Math.min(800, nextX));
      nextY = Math.max(0, Math.min(600, nextY));

      setLocalX(nextX);
      setLocalY(nextY);
      sendMovement(nextX, nextY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localX, localY, sendMovement, sendAttack]);

  useEffect(() => {
    if (!myPlayer) return;
    setLocalX(myPlayer.x);
    setLocalY(myPlayer.y);
  }, [myPlayer?.x, myPlayer?.y]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 border-b border-purple-500/30">
        <div className="flex items-center gap-4">
          <Swords className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
              COLOSSEUM ARENA {connected ? 'LIVE' : 'OFFLINE'}
            </h1>
            <p className="text-xs text-gray-500">
              {connected ? gameStatus.toUpperCase() : 'CONNECTING'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          {connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          <span>{connected ? 'Connected to Colyseus' : 'Trying to connect...'}</span>
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
        {connectionError && (
          <div className="absolute top-4 z-20 bg-red-950/80 border border-red-500/40 text-red-200 px-4 py-2 rounded-lg text-sm">
            {connectionError}
          </div>
        )}

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
        {connected && gameStatus === "waiting" && (
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

        {connected && gameStatus === "countdown" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="text-center">
              <Clock className="w-24 h-24 text-purple-300 mx-auto mb-6 animate-pulse" />
              <h2 className="text-5xl font-bold text-white mb-3">MATCH STARTING</h2>
              <p className="text-2xl text-purple-200">{gameState.countdownTime ?? 0}</p>
            </div>
          </div>
        )}
        
        {gameStatus === "playing" && (
          <>
            {/* Player markers */}
            {arenaPlayers.map((player) => {
              const left = `${(player.x / 800) * 100}%`;
              const top = `${(player.y / 600) * 100}%`;
              const isMe = player.id === myPlayer?.id;
              return (
                <div
                  key={player.id}
                  className="absolute text-center"
                  style={{ left, top, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${isMe ? 'bg-yellow-500/45 border-3 border-yellow-400 shadow-yellow-500/30' : player.team === 'red' ? 'bg-red-500/40 border-3 border-red-500 shadow-red-500/20' : 'bg-blue-500/40 border-3 border-blue-500 shadow-blue-500/20'}`}>
                    {player.name?.[0] || '?'}
                  </div>
                  <div className={`text-xs mt-2 font-bold ${isMe ? 'text-yellow-200' : player.team === 'red' ? 'text-red-300' : 'text-blue-300'}`}>
                    {isMe ? `${player.name} (You)` : player.name}
                  </div>
                </div>
              );
            })}
            
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
          WASD / Arrows: Move • SPACE: Attack
        </div>
      </div>
    </div>
  );
}