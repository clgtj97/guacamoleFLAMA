import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, Room } from 'colyseus.js';

function resolveColyseusUrl(): string {
  const envUrl = (import.meta as any)?.env?.VITE_COLYSEUS_URL as string | undefined;
  const queryUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('colyseusUrl') || undefined
    : undefined;
  const storageUrl = typeof window !== 'undefined'
    ? window.localStorage.getItem('VITE_COLYSEUS_URL') || undefined
    : undefined;

  if (queryUrl && typeof window !== 'undefined') {
    window.localStorage.setItem('VITE_COLYSEUS_URL', queryUrl);
  }

  const value = (queryUrl || envUrl || storageUrl || '').trim();

  if (!value) {
    throw new Error('VITE_COLYSEUS_URL is not set. Add it to .env or pass ?colyseusUrl=wss://... for quick local testing.');
  }

  if (value.startsWith('https://')) {
    return `wss://${value.slice('https://'.length)}`;
  }

  if (value.startsWith('http://')) {
    return `ws://${value.slice('http://'.length)}`;
  }

  if (!value.startsWith('ws://') && !value.startsWith('wss://')) {
    throw new Error('VITE_COLYSEUS_URL must start with ws:// or wss://');
  }

  return value;
}

interface ColosseumPlayer {
  id: string;
  name: string;
  team: string;
  x: number;
  y: number;
  score?: number;
  kills?: number;
  deaths?: number;
  health?: number;
  isAlive?: boolean;
}

interface ColosseumGameState {
  gameStatus?: 'waiting' | 'countdown' | 'playing' | 'finished';
  gameTime?: number;
  matchTime?: number;
  redScore?: number;
  blueScore?: number;
  countdownTime?: number;
  players?: any;
}

export function useColosseumMultiplayer(playerName: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ColosseumGameState>({});
  const [players, setPlayers] = useState<Map<string, ColosseumPlayer>>(new Map());
  const [myPlayer, setMyPlayer] = useState<ColosseumPlayer | null>(null);
  const connectStartedRef = useRef(false);

  useEffect(() => {
    if (!playerName?.trim() || connectStartedRef.current) return;
    let wsUrl = '';

    try {
      wsUrl = resolveColyseusUrl();
    } catch (error: any) {
      setConnectionError(error?.message || 'Invalid Colyseus URL configuration');
      return;
    }

    connectStartedRef.current = true;

    let activeRoom: Room | null = null;
    const client = new Client(wsUrl);

    const join = async () => {
      try {
        const joinedRoom = await client.joinOrCreate('colosseum_game', {
          name: playerName,
        });

        activeRoom = joinedRoom;
        setRoom(joinedRoom);
        setConnected(true);
        setConnectionError(null);

        const syncPlayers = (state: any) => {
          const nextPlayers = new Map<string, ColosseumPlayer>();
          const schemaPlayers = state?.players;

          if (schemaPlayers?.forEach) {
            schemaPlayers.forEach((player: any, sessionId: string) => {
              nextPlayers.set(sessionId, {
                id: player.id,
                name: player.name,
                team: player.team,
                x: player.x,
                y: player.y,
                score: player.score,
                kills: player.kills,
                deaths: player.deaths,
                health: player.health,
                isAlive: player.isAlive,
              });
            });
          }

          setPlayers(nextPlayers);
          const me = nextPlayers.get(joinedRoom.sessionId) || null;
          setMyPlayer(me);
          if (state) {
            setGameState({
              gameStatus: state.gameStatus,
              gameTime: state.gameTime,
              matchTime: state.matchTime,
              redScore: state.redScore,
              blueScore: state.blueScore,
              countdownTime: state.countdownTime,
            });
          }
        };

        joinedRoom.onStateChange((state: any) => {
          syncPlayers(state);
        });

        joinedRoom.onMessage('game_state', (data: any) => {
          setGameState((prev) => ({
            ...prev,
            gameStatus: data.gameStatus,
            gameTime: data.gameTime,
            matchTime: data.matchTime,
            redScore: prev.redScore ?? 0,
            blueScore: prev.blueScore ?? 0,
          }));
        });

        joinedRoom.onMessage('countdown', (time: number) => {
          setGameState((prev) => ({ ...prev, countdownTime: time, gameStatus: 'countdown' }));
        });

        joinedRoom.onMessage('game_started', () => {
          setGameState((prev) => ({ ...prev, gameStatus: 'playing', countdownTime: 0 }));
        });

        joinedRoom.onMessage('game_over', (data: any) => {
          setGameState((prev) => ({
            ...prev,
            gameStatus: 'finished',
            redScore: data.redScore,
            blueScore: data.blueScore,
          }));
        });

        joinedRoom.onMessage('player_joined_game', (data: any) => {
          setPlayers((prev) => {
            const next = new Map(prev);
            next.set(data.id, {
              id: data.id,
              name: data.name,
              team: data.team,
              x: 100,
              y: 300,
              score: 0,
              kills: 0,
              deaths: 0,
              health: 100,
              isAlive: true,
            });
            return next;
          });
        });

        joinedRoom.onMessage('player_left_game', (data: any) => {
          setPlayers((prev) => {
            const next = new Map(prev);
            next.delete(data.id);
            return next;
          });
        });

        joinedRoom.onLeave(() => {
          setConnected(false);
          setRoom(null);
        });

        syncPlayers(joinedRoom.state);
      } catch (error: any) {
        setConnectionError(error?.message || 'Failed to join colosseum room');
      }
    };

    join();

    return () => {
      if (activeRoom) {
        activeRoom.leave();
      }
    };
  }, [playerName]);

  const sendMovement = useCallback((x: number, y: number) => {
    if (!room || !connected) return;
    room.send('player_move', { x, y });
  }, [room, connected]);

  const sendAttack = useCallback((attackType: 'melee' | 'ranged') => {
    if (!room || !connected) return;
    room.send('player_attack', {
      attackType,
      angle: 0,
      power: 1,
      targetId: null,
    });
  }, [room, connected]);

  return {
    room,
    connected,
    connectionError,
    gameState,
    players,
    myPlayer,
    sendMovement,
    sendAttack,
  };
}
