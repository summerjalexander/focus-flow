// Fix: Replaced the entire file with a programmatic sound generation service
// to resolve missing sound asset exports. All sounds are now generated
// using the Web Audio API, removing the need for base64-encoded assets.

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
    try { noiseNode.stop(); } catch(e) {}
    noiseNode.disconnect();
    noiseNode = null;
  }
  rainNodes.forEach(node => {
    try { node.oscillator.stop(); } catch(e) {}
    node.oscillator.disconnect();
    node.gain.disconnect();
  });
  rainNodes = [];
  forestNodes.forEach(node => {
      try { node.oscillator.stop(); } catch(e) {}
      node.oscillator.disconnect();
      node.gain.disconnect();
  });
  forestNodes = [];
};

export const playBrownNoise = () => {
  stopAllSounds();
  const context = getAudioContext();
  const gain = getMasterGain();
  if (!context || !gain) return;

  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // (roughly) compensate for gain
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

  // White noise source
  const bufferSize = context.sampleRate * 2; // 2 seconds of noise
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noiseSource = context.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;
  noiseNode = noiseSource; // Store for stopping

  // Bandpass filter to shape the noise into a "rain" sound
  const bandpass = context.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1200; // Middle frequency for rain hiss
  bandpass.Q.value = 5;

  // LFO to modulate the filter frequency for a "pitter-patter" effect
  const lfo = context.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 10; // How fast the patter is

  const lfoGain = context.createGain();
  lfoGain.gain.value = 400; // How much the frequency varies

  lfo.connect(lfoGain);
  lfoGain.connect(bandpass.frequency);
  
  noiseSource.connect(bandpass).connect(gain);
  
  lfo.start();
  noiseSource.start();
  
  rainNodes.push({ oscillator: lfo, gain: lfoGain });
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
    
    const bufferSize = context.sampleRate * 2;
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
        if (!getAudioContext() || !soundLoopTimeoutId) return; // Stop if context is gone or sounds were stopped
        const now = context.currentTime;
        
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'sine';
        
        const startFreq = Math.random() * 1500 + 1000;
        const endFreq = startFreq + (Math.random() * 1000 - 500);
        const duration = Math.random() * 0.15 + 0.05;

        oscillator.frequency.setValueAtTime(startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(100, endFreq), now + duration * 0.8);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(gainNode).connect(gain);
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        soundLoopTimeoutId = window.setTimeout(chirp, Math.random() * 4000 + 1500);
    };
    soundLoopTimeoutId = window.setTimeout(chirp, 500);
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
