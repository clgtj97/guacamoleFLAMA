// GameAd.tsx
import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';

interface GameAdProps {
  title: string;
  content: string;
  status?: string;
  accentColor?: string;
  image?: string;
  actionLabel?: string;
  onClick?: () => void;
  /** New props for close button */
  showCloseButton?: boolean;
  onClose?: () => void;
  isPremium?: boolean;           // Only show close if premium
}

const GameAd: React.FC<GameAdProps> = ({
  title,
  content,
  status,
  accentColor = '#EF4444',
  image,
  actionLabel,
  onClick,
  showCloseButton = false,
  onClose,
  isPremium = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        boxShadow: `0 0 40px ${accentColor}20, inset 0 1px rgba(255,255,255,0.05)`,
        minHeight: '120px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background image */}
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        </>
      )}

      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

      {/* Premium Close Button - Positioned at top-right border */}
      {showCloseButton && isPremium && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onClose();
          }}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
          title="Close ad (Premium)"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l rounded-tl opacity-40" style={{ borderColor: accentColor }} />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r rounded-br opacity-40" style={{ borderColor: accentColor }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-4 h-full">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-[0.2em] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", color: accentColor }}>
            {title}
          </h3>
          <p className="text-white text-lg font-bold leading-tight mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {content}
          </p>
          {status && (
            <p className="text-[10px] text-gray-400 font-medium mt-1" style={{ fontFamily: "'Zalando Sans SemiExpanded', sans-serif" }}>
              {status}
            </p>
          )}
        </div>

        {actionLabel && (
          <div className="flex items-center gap-1 mt-3 text-[10px] font-bold tracking-wider text-gray-400 group-hover:text-white transition-colors">
            {actionLabel}
            <ArrowUpRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameAd;