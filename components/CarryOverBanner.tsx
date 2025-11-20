
import React from 'react';
import { RefreshCwIcon, XIcon } from './Icons';

interface CarryOverBannerProps {
  message: string;
  onCarryOver: () => void;
  onDismiss: () => void;
}

const CarryOverBanner: React.FC<CarryOverBannerProps> = ({ message, onCarryOver, onDismiss }) => {
  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-stretch bg-[#007370]/20 border border-[#007370]/50 rounded-xl overflow-hidden shadow-lg">
        <button
          onClick={onCarryOver}
          className="flex-grow flex items-center p-4 text-[#f7f7f7] hover:bg-[#007370]/30 transition-colors duration-200 group text-left"
        >
          <div className="flex-shrink-0 bg-[#007370] p-2 rounded-full mr-3 group-hover:rotate-180 transition-transform duration-500">
             <RefreshCwIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-sm leading-snug">{message}</span>
        </button>
        
        <button 
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex-none px-4 border-l border-[#007370]/30 text-[#69adaf] hover:text-[#ee6650] hover:bg-[#ee6650]/10 transition-colors flex items-center justify-center"
            aria-label="Dismiss notification"
            title="Dismiss"
        >
            <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CarryOverBanner;
