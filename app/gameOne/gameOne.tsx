import React, { useState, useEffect } from 'react';
import GameOneWeb from './gameOneWeb';
import GameOneMobile from './gameOneMobile';

export default function GameOne() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This code only runs on the client
    setIsClient(true);

    // One-time device detection (do not react to resize).
    // This avoids DevTools resizing from toggling desktop into mobile view.
    const userAgent = navigator.userAgent;
    const params = new URLSearchParams(window.location.search);

    // Debug overrides:
    // ?view=desktop -> force desktop
    // ?view=mobile  -> force mobile
    const forcedView = params.get('view');
    if (forcedView === 'desktop') {
      setIsMobile(false);
      return;
    }
    if (forcedView === 'mobile') {
      setIsMobile(true);
      return;
    }

    // Keep localhost debugging stable on desktop unless explicitly forced.
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (isLocalHost) {
      setIsMobile(false);
      return;
    }

    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|PlayBook|Silk/i.test(userAgent);
    setIsMobile(isMobileUA);
  }, []);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading Ferrari Game...</div>
      </div>
    );
  }

  return isMobile
    ? <GameOneMobile gameLogic={null} playAnimation={() => {}} />
    : <GameOneWeb />;
}