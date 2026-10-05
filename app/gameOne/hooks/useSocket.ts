import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  isClubMember?: boolean;
}

export const useSocket = (roomId: string, user: User) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In production, replace with your server URL
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      query: { roomId, userId: user.id, userName: user.name }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('joinRoom', roomId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId, user]);

  return { socket, isConnected };
};