import React, { useState, useEffect } from 'react';
import { XIcon, MusicIcon } from './Icons';
import * as soundService from '../services/soundService';

interface AmbientSoundsProps {
  isOpen: boolean;
  onClose: () => void;
}

type SoundType = 'none' | 'noise' | 'rain' | 'forest';

const AmbientSounds: React.FC<AmbientSoundsProps> = ({ isOpen, onClose }) => {
  const [activeSound, setActiveSound] = useState<SoundType>('none');
  const [volume, setVolume] = useState(0.5);

  const playSound = (sound: SoundType) => {
    if (sound === activeSound) {
        soundService.stopSounds();
        setActiveSound('none');
        return;
    }
    
    switch (sound) {
      case 'noise':
        soundService.playBrownNoise();
        break;
      case 'rain':
        soundService.playRain();
        break;
      case 'forest':
        soundService.playForest();
        break;
      default:
        soundService.stopSounds();
    }
    setActiveSound(sound);
  };
  
  useEffect(() => {
    soundService.setVolume(volume);
  }, [volume]);

  useEffect(() => {
      // Cleanup on component unmount
      return () => {
          soundService.stopSounds();
      }
  }, []);

  // When the panel is closed, stop the sounds.
  useEffect(() => {
      if (!isOpen) {
          soundService.stopSounds();
          setActiveSound('none');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const soundOptions: { id: SoundType, label: string }[] = [
      { id: 'noise', label: 'Brown Noise' },
      { id: 'rain', label: 'Rain' },
      { id: 'forest', label: 'Forest' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#060644] border-2 border-[#69adaf] rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-xs text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <MusicIcon className="w-6 h-6 text-[#007370]" />
             <h3 className="text-xl font-bold">Ambient Sounds</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#69adaf] hover:text-[#ee6650]">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
            {soundOptions.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => playSound(opt.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${activeSound === opt.id ? 'bg-[#ee6650] text-white font-bold' : 'bg-[#007370]/30 hover:bg-[#007370]/50'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
        <div className="mt-6">
            <label htmlFor="volume" className="block text-sm text-[#69adaf] mb-2">Volume</label>
            <input 
                type="range"
                id="volume"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#69adaf]/30 rounded-lg appearance-none cursor-pointer accent-[#ee6650]"
            />
        </div>
      </div>
    </div>
  );
};

export default AmbientSounds;