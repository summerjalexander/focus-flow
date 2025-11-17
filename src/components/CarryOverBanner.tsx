import React, { useState, useRef } from 'react';
import { RefreshCwIcon } from './Icons';

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
    <div className="mt-6 text-center overflow-hidden">
      <div
        ref={bannerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className={`transition-all duration-300 ease-in-out ${isDismissing ? 'opacity-0' : 'opacity-100'}`}
      >
        <button
          onClick={onCarryOver}
          className="bg-[#69adaf]/10 text-[#69adaf] font-semibold py-2 px-4 rounded-lg hover:bg-[#69adaf]/20 transition-colors duration-200 flex items-center justify-center mx-auto text-sm"
        >
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          {message}
        </button>
      </div>
    </div>
  );
};

export default CarryOverBanner;
