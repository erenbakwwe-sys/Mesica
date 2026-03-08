// Simple Web Audio API based beep generator
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playSound(type: 'new_order' | 'preparing' | 'ready' | 'delivered' | 'waiter') {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'new_order') {
    // Two quick high beeps
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1046.50, now + 0.1);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else if (type === 'preparing') {
    // Low to mid beep
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(660, now + 0.2);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } else if (type === 'ready') {
    // High cheerful beep
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659.25, now);
    oscillator.frequency.setValueAtTime(880, now + 0.1);
    oscillator.frequency.setValueAtTime(1318.51, now + 0.2);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } else if (type === 'delivered') {
    // Soft low beep
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.3);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } else if (type === 'waiter') {
    // Attention beep
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(0, now + 0.1);
    oscillator.frequency.setValueAtTime(523.25, now + 0.2);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }
}
