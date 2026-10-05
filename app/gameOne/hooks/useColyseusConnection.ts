import { useState, useEffect } from 'react';

interface Message {
  user: string;
  message: string;
  timestamp: number;
}

export const useColyseusConnection = (deviceType: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [room, setRoom] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const connectToServer = async () => {
      try {
        console.log('🔄 Attempting to connect to Colyseus server...');
        
        // Use namespace import for Colyseus
        const Colyseus = await import('colyseus.js');
        const client = new Colyseus.Client('ws://localhost:2567');
        
        console.log('📡 Client created, joining room...');
        const room = await client.joinOrCreate('chat_room', {
          deviceType,
          username: `user_${deviceType}_${Math.random().toString(36).substr(2, 5)}`,
          joinTime: Date.now()
        });

        setRoom(room);
        setConnectionStatus('connected');
        console.log('✅ Successfully joined room:', room.id);
        console.log('👥 Room sessionId:', room.sessionId);

        // Listen for messages
        room.onMessage('message', (message: Message) => {
          console.log('📨 Received message:', message);
          setMessages(prev => [...prev, message]);
        });

        // Listen for state changes
        room.onStateChange((state: any) => {
          console.log('🔄 Room state changed:', state);
          if (state.messages) {
            setMessages(state.messages);
          }
        });

        room.onLeave(() => {
          console.log('❌ Left room');
          setConnectionStatus('disconnected');
        });

        room.onError((error: any) => {
          console.error('💥 Room error:', error);
          setConnectionStatus('disconnected');
        });

      } catch (error: any) {
        console.error('🚫 Connection failed:', error);
        setConnectionStatus('disconnected');
        
        // Fallback to mock data
        setMessages([
          { 
            user: 'System', 
            message: `Connection failed: ${error.message}`, 
            timestamp: Date.now() 
          },
          { 
            user: 'System', 
            message: 'Make sure Colyseus server is running on port 2567', 
            timestamp: Date.now() 
          }
        ]);
      }
    };

    connectToServer();

    return () => {
      if (room) {
        console.log('🧹 Cleaning up room connection');
        room.leave();
      }
    };
  }, [deviceType, isClient]);

  const sendMessage = async (message: string) => {
    if (message.trim()) {
      const newMessage = {
        user: `User_${deviceType}`,
        message: message.trim(),
        timestamp: Date.now()
      };

      console.log('📤 Attempting to send message:', newMessage);

      if (room) {
        try {
          room.send('message', newMessage);
          console.log('✅ Message sent successfully');
        } catch (error) {
          console.error('❌ Failed to send message:', error);
          // Fallback: add message locally
          setMessages(prev => [...prev, newMessage]);
        }
      } else {
        console.log('⚠️ No room connection, adding message locally');
        setMessages(prev => [...prev, newMessage]);
      }
    }
  };

  return { 
    messages, 
    sendMessage, 
    connectionStatus 
  };
};