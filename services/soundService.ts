let audioContext: AudioContext | null = null;
let noiseNode: AudioBufferSourceNode | null = null;
let rainNodes: { oscillator: OscillatorNode, gain: GainNode }[] = [];
let forestNodes: { oscillator: OscillatorNode, gain: GainNode }[] = [];
let masterGain: GainNode | null = null;
let soundLoopTimeoutId: number | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
  }
  return audioContext;
};

const getMasterGain = () => {
    const context = getAudioContext();
    if (!context) return null;
    if (!masterGain) {
        masterGain = context.createGain();
        masterGain.gain.setValueAtTime(0.5, context.currentTime); // Default volume
        masterGain.connect(context.destination);
    }
    return masterGain;
}


const stopAllSounds = () => {
  if (soundLoopTimeoutId) {
    clearTimeout(soundLoopTimeoutId);
    soundLoopTimeoutId = null;
  }
  if (noiseNode) {
    noiseNode.stop();
    noiseNode.disconnect();
    noiseNode = null;
  }
  rainNodes.forEach(node => {
    node.oscillator.stop();
    node.oscillator.disconnect();
    node.gain.disconnect();
  });
  rainNodes = [];
  forestNodes.forEach(node => {
      node.oscillator.stop();
      node.oscillator.disconnect();
      node.gain.disconnect();
  });
  forestNodes = [];
};

export const playWhiteNoise = () => {
  stopAllSounds();
  const context = getAudioContext();
  const gain = getMasterGain();
  if (!context || !gain) return;

  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  noiseNode = context.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  noiseNode.connect(gain);
  noiseNode.start(0);
};

export const playRain = () => {
  stopAllSounds();
  const context = getAudioContext();
  const gain = getMasterGain();
  if (!context || !gain) return;

  for (let i = 0; i < 200; i++) {
    const oscillator = context.createOscillator();
    const panner = context.createStereoPanner();
    const gainNode = context.createGain();

    oscillator.type = 'sawtooth';
    const freq = Math.random() * 8000 + 2000;
    oscillator.frequency.value = freq;
    
    panner.pan.value = Math.random() * 2 - 1;
    
    gainNode.gain.value = Math.random() * 0.01;

    oscillator.connect(gainNode).connect(panner).connect(gain);
    oscillator.start(context.currentTime + Math.random());
    oscillator.stop(context.currentTime + Math.random() + 0.1);
    rainNodes.push({ oscillator, gain: gainNode });
  }

  // Loop
  soundLoopTimeoutId = window.setTimeout(playRain, 100);
};

export const playForest = () => {
    stopAllSounds();
    const context = getAudioContext();
    const gain = getMasterGain();
    if (!context || !gain) return;

    // Wind
    const windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    
    const bufferSize = 4096;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = context.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(windFilter).connect(gain);
    whiteNoise.start();
    noiseNode = whiteNoise; // Keep track to stop it

    // Bird chirps
    const chirp = () => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(Math.random() * 2000 + 1000, context.currentTime);
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
        
        oscillator.connect(gainNode).connect(gain);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        forestNodes.push({ oscillator, gain: gainNode });
        
        soundLoopTimeoutId = window.setTimeout(chirp, Math.random() * 5000 + 2000);
    };
    chirp();
};


export const stopSounds = () => {
  stopAllSounds();
};

export const setVolume = (volume: number) => { // volume is 0 to 1
    const gain = getMasterGain();
    const context = getAudioContext();
    if (gain && context) {
        gain.gain.setValueAtTime(volume, context.currentTime);
    }
}