import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full bg-[#69adaf]/30 rounded-full h-4 mb-4 overflow-hidden">
      <div
        className="bg-gradient-to-r from-[#007370] to-[#ee6650] h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;