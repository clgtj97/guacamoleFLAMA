import React, { useState, useEffect } from 'react';
import GameOneWeb from './gameOneWeb';
import GameOneMobile from './gameOneMobile';

export default function GameOne() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This code only runs on the client
    setIsClient(true);
    
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      // Treat tablets as mobile (iPad, Android tablets, etc.)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|PlayBook|Silk/i.test(userAgent) || width <= 1024;

      setIsMobile(isMobileDevice);
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading Ferrari Game...</div>
      </div>
    );
  }

  return isMobile ? <GameOneMobile /> : <GameOneWeb />;
}