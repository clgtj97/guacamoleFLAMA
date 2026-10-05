// hooks/useFerrariMultiplayer.ts
import { useState, useEffect, useCallback } from 'react';
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

export function useFerrariMultiplayer() {
  const [client, setClient] = useState<Client | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Map<string, any>>(new Map());
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [myPlayer, setMyPlayer] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize client
  useEffect(() => {
    try {
      const wsUrl = resolveColyseusUrl();
      console.log('=== ENV DEBUG ===');
      console.log('VITE_COLYSEUS_URL:', (import.meta as any)?.env?.VITE_COLYSEUS_URL);
      console.log('QUERY colyseusUrl:', typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('colyseusUrl') : null);
      console.log('LOCALSTORAGE VITE_COLYSEUS_URL:', typeof window !== 'undefined' ? window.localStorage.getItem('VITE_COLYSEUS_URL') : null);
      console.log('ALL VITE VARS:', Object.keys((import.meta as any)?.env || {}).filter(k => k.startsWith('VITE_')));
      console.log('MODE:', (import.meta as any)?.env?.MODE);
      console.log('Connecting to:', wsUrl);
      const gameClient = new Client(wsUrl);
      setClient(gameClient);
      setConnectionError(null);
    } catch (error: any) {
      console.error('Colyseus URL configuration error:', error?.message || error);
      setConnectionError(error?.message || 'Invalid Colyseus URL configuration');
    }
    
    return () => {
      setRoom((activeRoom) => {
        if (activeRoom) {
          console.log('Leaving room...');
          activeRoom.leave();
        }
        return null;
      });
    };
  }, []);

  // Connect to Ferrari Metaverse
  const connect = useCallback(async (playerName: string) => {
    if (!client) {
      setConnectionError('Client not initialized');
      return null;
    }

    try {
      console.log('Joining Ferrari Metaverse...');
      
      // Join the room with player info
      const joinedRoom = await client.joinOrCreate('ferrari_metaverse', {
        name: playerName,
        avatar: 'default',
        isClubMember: false
      });

      const roomLabel = (joinedRoom as any).roomId || joinedRoom.id;
      console.log('✅ Connected! Room:', roomLabel, 'session:', joinedRoom.sessionId);
      setRoom(joinedRoom);
      setConnected(true);
      setConnectionError(null);

      // Listen for room state updates
      joinedRoom.onStateChange((state) => {
        // Update players
        const newPlayers = new Map();
        state.players.forEach((player: any, sessionId: string) => {
          newPlayers.set(sessionId, player);
          
          // Check if this is me
          if (sessionId === joinedRoom.sessionId) {
            setMyPlayer(player);
          }
        });
        setPlayers(newPlayers);
        
        // Update chat messages
        if (state.chatMessages) {
          setChatMessages([...state.chatMessages]);
        }
      });

      // Listen for real-time events
      joinedRoom.onMessage('new_chat_message', (message) => {
        console.log('New chat:', message);
        setChatMessages(prev => [...prev, message]);
      });

      joinedRoom.onMessage('player_joined', (player) => {
        console.log('Player joined:', player.name);
      });

      joinedRoom.onMessage('player_left', (player) => {
        console.log('Player left:', player.name);
      });

      joinedRoom.onMessage('player_acted', (data) => {
        console.log('Player action:', data);
      });

      // Get initial room state
      joinedRoom.onMessage('room_state', (data) => {
        console.log('Received room state:', data.players.length, 'players');
      });

      return joinedRoom;
    } catch (error: any) {
      console.error('Failed to connect:', error);
      setConnectionError(error.message);
      return null;
    }
  }, [client]);

  // Send movement update
  const sendMovement = useCallback((data: {
    x: number;
    y: number;
    direction: string;
    animation: string;
    roomId: string;
  }) => {
    if (room && connected) {
      room.send('player_move', data);
    }
  }, [room, connected]);

  // Send chat message
  const sendChatMessage = useCallback((content: string) => {
    if (room && connected && content.trim()) {
      room.send('chat_message', {
        content: content.trim(),
        type: 'text'
      });
    }
  }, [room, connected]);

  // Send player action
  const sendPlayerAction = useCallback((action: string) => {
    if (room && connected) {
      room.send('player_action', { action });
    }
  }, [room, connected]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (room) {
      room.leave();
      setRoom(null);
      setConnected(false);
      setPlayers(new Map());
      setChatMessages([]);
      setMyPlayer(null);
    }
  }, [room]);

  return {
    client,
    room,
    players,
    chatMessages,
    connected,
    myPlayer,
    connectionError,
    connect,
    disconnect,
    sendMovement,
    sendChatMessage,
    sendPlayerAction
  };
}