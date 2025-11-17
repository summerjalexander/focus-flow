import React from 'react';
import { SparklesIcon } from './Icons';

interface EncouragementModalProps {
  message: string;
  isLoading: boolean;
  onClose: () => void;
}

const EncouragementModal: React.FC<EncouragementModalProps> = ({ message, isLoading, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-[#060644] rounded-2xl shadow-2xl shadow-[#ee6650]/20 p-6 sm:p-8 max-w-md w-full text-center border border-[#69adaf] transform transition-all duration-300 scale-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#007370] to-[#ee6650] flex items-center justify-center mb-6">
            <SparklesIcon className="w-8 h-8 text-[#f7f7f7]"/>
        </div>
        {isLoading ? (
          <div>
            <div className="animate-pulse h-6 w-3/4 bg-[#69adaf]/30 rounded-md mx-auto mb-2"></div>
            <div className="animate-pulse h-6 w-1/2 bg-[#69adaf]/30 rounded-md mx-auto"></div>
          </div>
        ) : (
          <p className="text-2xl font-semibold text-[#f7f7f7] leading-relaxed">{message}</p>
        )}
        <button
          onClick={onClose}
          className="mt-8 bg-[#69adaf]/20 text-[#f7f7f7] font-semibold py-2 px-6 rounded-lg hover:bg-[#69adaf]/40 transition-colors duration-200"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default EncouragementModal;