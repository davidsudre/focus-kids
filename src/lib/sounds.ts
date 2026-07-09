// Synth engine using Web Audio API for custom, premium, calm sound effects
// Designed specifically to be soft, warm, and encourage focus (no harsh high pitches or loud alarms)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Initialize audio context safely on first user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleSounds(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

// 1. Soft Pop/Tick (for menu clicks and item interactions)
export function playClickSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

  gain.gain.setValueAtTime(0.04, now); // soft volume
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

// 2. Gentle Pop (for checking a subtask - crisp but very soft)
export function playSubtaskPopSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.05); // Upward sweep for positive feedback

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, now); // Cut off harsh high frequencies

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

// 3. Golden Success Chime (completing a full mission - serene C-Major 9th chord sweep)
export function playMissionSuccessSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5 (Serene Cmaj7/Cmaj9 notes)

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Arpeggiate slightly
    const startTime = now + index * 0.07;
    const duration = 0.8;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Subtle sweet vibrato
    osc.frequency.linearRampToValueAtTime(freq + 4, startTime + duration / 2);
    osc.frequency.linearRampToValueAtTime(freq, startTime + duration);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05); // Gentle attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });
}

// 4. Epic Point Approval / Level Up (Magical ascending harp sweep)
export function playPointsApprovedSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6 (Pentatonic Scale - pure harmony)

  scale.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const delay = index * 0.06;
    const startTime = now + delay;
    const duration = 0.6;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

// 5. Warm Celebration Gong (Resgate de prêmios - deep, satisfying resonant bell)
export function playRewardClaimedSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Harmonic overtone synthesis for a bell sound
  const fundamental = 196.00; // G3 (Warm fundamental)
  const partials = [1, 2, 3, 4.2, 5.4]; // Overtones
  const amplitudes = [0.08, 0.04, 0.02, 0.015, 0.01];

  partials.forEach((multiplier, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const freq = fundamental * multiplier;
    const startTime = now;
    const duration = index === 0 ? 1.5 : 1.0 - (index * 0.15); // High notes decay faster

    osc.type = "triangle"; // Triangle has a softer harmonic structure than sawtooth or square
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, startTime); // Keeps it extremely warm and cozy

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(amplicuts(amplitudes[index]), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });

  // Helper inside to keep amplitudes valid
  function amplicuts(val: number) {
    return Math.max(0.001, val * 0.7);
  }
}
