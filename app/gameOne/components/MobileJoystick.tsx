import React, { useRef, useState } from 'react';

interface MobileJoystickProps {
  onMove: (direction: 'left' | 'right' | null) => void;
}

const MobileJoystick: React.FC<MobileJoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const touchX = e.touches[0].clientX;
    
    if (touchX < centerX - 30) {
      setActiveDirection('left');
      onMove('left');
    } else if (touchX > centerX + 30) {
      setActiveDirection('right');
      onMove('right');
    } else {
      setActiveDirection(null);
      onMove(null);
    }
  };

  const handleTouchEnd = () => {
    setActiveDirection(null);
    onMove(null);
  };

  return (
    <div 
      ref={joystickRef}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-black/20 rounded-full z-50 touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`absolute top-1/2 left-1/2 w-16 h-16 bg-white/70 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-transform
        ${activeDirection === 'left' ? '-translate-x-12' : ''}
        ${activeDirection === 'right' ? 'translate-x-12' : ''}`}
      />
    </div>
  );
};

export default MobileJoystick;