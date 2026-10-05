// hooks/useFerrariMultiplayer.ts
import { useState, useEffect, useCallback } from 'react';
import { Client, Room } from 'colyseus.js';

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
    // Use WebSocket URL based on environment
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}` 
      : 'ws://localhost:2567';
    
    console.log('Connecting to:', wsUrl);
    const gameClient = new Client(wsUrl);
    setClient(gameClient);
    
    return () => {
      if (room) {
        console.log('Leaving room...');
        room.leave();
      }
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

      console.log('✅ Connected! Room:', joinedRoom.id);
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