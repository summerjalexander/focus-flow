// A single AudioContext for the whole app
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch(e) {
        console.error("Web Audio API is not supported in this browser");
    }
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number) => {
  try {
    const context = getAudioContext();
    if (!context || context.state === 'suspended') {
      context?.resume();
    }
    if (!context) return;
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  } catch (error) {
    console.error("Failed to play audio cue:", error);
  }
};

export const playStartSound = () => {
  playTone(440, 0.1); 
  setTimeout(() => playTone(660, 0.1), 100);
};

export const playEndSound = () => {
  playTone(880, 0.3);
};
