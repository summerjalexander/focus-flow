import React, { useState, useRef } from 'react';
import { RefreshCwIcon, XIcon } from './Icons';

interface CarryOverBannerProps {
  message: string;
  onCarryOver: () => void;
  onDismiss: () => void;
}

const CarryOverBanner: React.FC<CarryOverBannerProps> = ({ message, onCarryOver, onDismiss }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const DISMISS_THRESHOLD = 100; // pixels

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
    if(bannerRef.current) {
        bannerRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diffX = currentX - touchStartX.current;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    
    if(bannerRef.current) {
        bannerRef.current.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
    }

    if (Math.abs(translateX) > DISMISS_THRESHOLD) {
      setIsDismissing(true);
      const bannerWidth = bannerRef.current?.offsetWidth || 500;
      const direction = translateX > 0 ? 1 : -1;
      setTranslateX(direction * bannerWidth);
      setTimeout(() => {
        onDismiss();
      }, 300); // match transition duration
    } else {
      setTranslateX(0);
    }
    touchStartX.current = null;
  };

  return (
    <div className="mt-6 flex justify-center overflow-hidden">
      <div
        ref={bannerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className={`transition-all duration-300 ease-in-out ${isDismissing ? 'opacity-0' : 'opacity-100'} flex flex-col sm:flex-row items-stretch sm:items-center bg-[#007370]/20 border border-[#007370]/50 rounded-xl overflow-hidden w-full shadow-lg`}
      >
        <button
          onClick={onCarryOver}
          className="flex-grow flex items-center justify-center sm:justify-start px-4 py-3 text-[#f7f7f7] hover:bg-[#007370]/30 transition-colors duration-200 group"
        >
          <div className="bg-[#007370] p-1.5 rounded-full mr-3 group-hover:rotate-180 transition-transform duration-500">
             <RefreshCwIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-sm text-left">{message}</span>
        </button>
        
        <div className="flex border-t sm:border-t-0 sm:border-l border-[#007370]/30">
             <button 
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="flex-1 sm:flex-none px-4 py-3 text-xs font-bold text-[#69adaf] hover:text-[#ee6650] hover:bg-[#ee6650]/10 transition-colors uppercase tracking-wider"
            >
                Dismiss
            </button>
        </div>
      </div>
    </div>
  );
};

export default CarryOverBanner;
