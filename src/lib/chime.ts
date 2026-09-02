let ctx: AudioContext | null = null;

/** Short two-tone notification chime for an incoming message — synthesized, no audio asset needed. */
export function playChime(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const notes: [freq: number, start: number, duration: number][] = [
      [880, 0, 0.12],
      [1318.5, 0.09, 0.16],
    ];

    for (const [freq, start, duration] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.15, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    }
  } catch {
    // Audio isn't critical — never let it break message delivery.
  }
}
