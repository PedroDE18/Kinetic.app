/**
 * Synthesizes a calming, resonant Tibetan singing bowl chime (528Hz fundamental + 1056Hz overtone)
 * using the Web Audio API. 100% offline, zero audio assets, pure harmonic synthesis.
 */
export function playRestTimerCompleteSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Fundamental Tone: 528 Hz (Harmonic Love / Restoration tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Overtone: 1056 Hz (Octave shimmer)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now + 0.05);
    gain2.gain.setValueAtTime(0.12, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.9);
  } catch {
    // Gracefully ignore audio errors (e.g. strict browser autoplay policy)
  }
}

/**
 * Plays a tranquil harmonic tone for breathwork transitions (e.g. 432 Hz inhale, 216 Hz exhale).
 */
export function playBreathworkTone(
  type: 'inhale' | 'exhale' | 'hold'
): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const freq = type === 'inhale' ? 432 : type === 'exhale' ? 288 : 360;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch {
    // Ignore autoplay restriction
  }
}

/**
 * Triggers device vibration pattern if supported by mobile browser.
 */
export function triggerHapticFeedback(pattern: number[] = [200, 100, 200]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore if not permitted
  }
}
