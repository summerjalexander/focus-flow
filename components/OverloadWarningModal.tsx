import React from 'react';

interface OverloadWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const OverloadWarningModal: React.FC<OverloadWarningModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      onClick={onCancel}
    >
      <div 
        className="bg-[#060644] rounded-2xl shadow-2xl shadow-[#ee6650]/20 p-6 sm:p-8 max-w-md w-full text-center border border-[#69adaf] transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-[#ee6650] mb-4">Whoa there, ambitious! 🚀</h3>
        <p className="text-[#f7f7f7] mb-6 leading-relaxed">
          We recommend focusing on just <b>5 priorities</b> per day to keep your flow steady and avoid burnout. 
        </p>
        <p className="text-[#69adaf] text-sm mb-8">
          Are you sure you want to add another task to today's list?
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#69adaf] text-[#69adaf] hover:bg-[#69adaf]/10 transition-colors font-semibold"
          >
            Not right now
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#ee6650] text-white hover:bg-[#d95a46] transition-colors font-semibold shadow-lg shadow-[#ee6650]/20"
          >
            Yes, add it
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverloadWarningModal;
