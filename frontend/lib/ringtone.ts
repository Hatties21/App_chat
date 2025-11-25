// Simple ringtone generator using Web Audio API
// Creates a pleasant ringing sound without needing audio files

class RingtonePlayer {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  play() {
    if (typeof window === "undefined") return;

    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 0.3; // 30% volume

    // Play ring pattern: beep-beep-pause
    this.playRingPattern();
  }

  private playRingPattern() {
    let beepCount = 0;
    
    this.intervalId = setInterval(() => {
      if (beepCount < 2) {
        // Play beep
        this.playBeep();
        beepCount++;
      } else {
        // Pause
        beepCount = 0;
      }
    }, 400); // Beep every 400ms
  }

  private playBeep() {
    if (!this.audioContext || !this.gainNode) return;

    // Create oscillator for this beep
    const oscillator = this.audioContext.createOscillator();
    const beepGain = this.audioContext.createGain();

    oscillator.connect(beepGain);
    beepGain.connect(this.gainNode);

    // Set frequency (higher pitch for incoming call)
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";

    // Envelope: fade in and out
    const now = this.audioContext.currentTime;
    beepGain.gain.setValueAtTime(0, now);
    beepGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    beepGain.gain.linearRampToValueAtTime(0, now + 0.2);

    // Play for 200ms
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  stop() {
    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop oscillator
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Already stopped
      }
      this.oscillator = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.gainNode = null;
  }
}

// Singleton instance
let ringtonePlayer: RingtonePlayer | null = null;

export function playRingtone() {
  if (ringtonePlayer) {
    ringtonePlayer.stop();
  }
  ringtonePlayer = new RingtonePlayer();
  ringtonePlayer.play();
}

export function stopRingtone() {
  if (ringtonePlayer) {
    ringtonePlayer.stop();
    ringtonePlayer = null;
  }
}
