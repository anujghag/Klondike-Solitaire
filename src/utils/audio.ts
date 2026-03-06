// src/utils/audio.ts

// Lazy initialization of AudioContext so it doesn't block the main thread
// and only starts when user interacts (which is required by browsers anyway)
let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let analyserData: Uint8Array<ArrayBuffer> | null = null;

const getContext = (): AudioContext => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

/**
 * Returns the shared AnalyserNode, creating it lazily.
 * All sounds should connect to this node instead of ctx.destination directly.
 */
const getMasterNode = (): AudioNode => {
    const ctx = getContext();
    if (!analyserNode) {
        analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.6;
        analyserNode.connect(ctx.destination);
        analyserData = new Uint8Array(analyserNode.frequencyBinCount);
    }
    return analyserNode;
};

/**
 * Returns a normalised 0–1 audio amplitude value.
 * Call this in a requestAnimationFrame loop to drive CSS reactivity.
 */
export const getAudioReactivity = (): number => {
    if (!analyserNode || !analyserData) return 0;
    analyserNode.getByteTimeDomainData(analyserData);
    let max = 0;
    for (let i = 0; i < analyserData.length; i++) {
        const v = Math.abs(analyserData[i] - 128);
        if (v > max) max = v;
    }
    return max / 128; // normalise to 0–1
};

// ─── INTERNALS ────────────────────────────────────────────────────────────────

/**
 * Creates a short noise burst, shaped by a custom gain envelope.
 * Used as the base for all physical card sounds.
 *
 * @param duration     Total duration in seconds
 * @param lowFreq      Bandpass low shelf (shapes the body of the sound)
 * @param highFreq     High-shelf cutoff (adds or removes crispness)
 * @param peakGain     Peak amplitude (0–1)
 * @param attackTime   How quickly the sound reaches peak (seconds)
 */
const createShapedNoise = (
    duration: number,
    lowFreq: number,
    highFreq: number,
    peakGain: number,
    attackTime: number = 0.002
) => {
    const ctx = getContext();
    const t = ctx.currentTime;

    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low shelf — gives the card body/weight
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = lowFreq;
    lowShelf.gain.value = 6;

    // High shelf — controls the crispness / paper texture
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = highFreq;
    highShelf.gain.value = -10; // roll off harshness above this

    // Master gain with a percussive envelope: fast attack, exponential decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    source.connect(lowShelf);
    lowShelf.connect(highShelf);
    highShelf.connect(gain);
    gain.connect(getMasterNode());

    source.start(t);
    source.stop(t + duration);
};

/**
 * Plays a soft sine-based thud — used to give card sounds a subtle
 * low-frequency "body thump" like a card landing on a felt table.
 */
const createThud = (freq: number, duration: number, gain: number) => {
    const ctx = getContext();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Pitch-drop envelope: starts at freq, decays fast — like a drum hit
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gainNode);
    gainNode.connect(getMasterNode());
    osc.start(t);
    osc.stop(t + duration);
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * A long, breathy paper swoosh — card sliding off the deck during deal.
 * Layered: high-frequency friction noise + low-frequency body thud.
 */
export const playCardDealSound = () => {
    try {
        // Paper sliding friction: relatively long, airy, mid-high texture
        createShapedNoise(0.14, 800, 5000, 0.18, 0.004);
        // Soft landing thud underneath
        createThud(120, 0.09, 0.06);
    } catch (e) { }
};

/**
 * A snappy, crisp click — card being placed / moved to a column.
 * Very short attack, higher frequency = tactile snap.
 */
export const playCardMoveSound = () => {
    try {
        // Sharp paper snap: short, bright, high texture
        createShapedNoise(0.055, 1200, 6000, 0.22, 0.001);
        // Tiny felt-surface thud
        createThud(160, 0.04, 0.05);
    } catch (e) { }
};

/**
 * A satisfying, slightly heavier placement sound for cards moved to
 * the foundation piles. More resonant than a regular move.
 */
export const playCardPlaceSound = () => {
    try {
        // Slightly fuller than a move — heavier card placement
        createShapedNoise(0.08, 900, 4500, 0.2, 0.002);
        createThud(100, 0.10, 0.09);
    } catch (e) { }
};

/**
 * A soft, muffled knock — the sound of a card being turned face-up.
 * Subtler than a move; the card is barely traveling.
 */
export const playCardFlipSound = () => {
    try {
        // Brief, muted flutter
        createShapedNoise(0.06, 600, 3500, 0.14, 0.003);
        createThud(140, 0.06, 0.04);
    } catch (e) { }
};

/**
 * A dull, low thump — card returned to deck or invalid move rejected.
 * No high-frequency crack; intentionally feels heavier and less satisfying.
 */
export const playErrorSound = () => {
    try {
        const ctx = getContext();
        const t = ctx.currentTime;

        // Low, muffled noise — like a card being slapped face-down
        createShapedNoise(0.09, 300, 1800, 0.16, 0.003);

        // A heavier, slower-decay thud to signal "no"
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

        osc.connect(gain);
        gain.connect(getMasterNode());
        osc.start(t);
        osc.stop(t + 0.2);
    } catch (e) { }
};

/**
 * A warm, casino-style victory chime — sine-wave arpeggios with soft
 * attack and natural decay. No square/sawtooth waves; pure tone quality.
 */
export const playVictorySound = () => {
    try {
        const ctx = getContext();

        /**
         * Plays a single note with a piano-like envelope:
         * fast attack, short decay, gentle sustain, natural release.
         */
        const playNote = (freq: number, start: number, duration: number, vol: number = 0.12) => {
            const t = ctx.currentTime + start;

            // Primary sine tone
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            // A soft harmonic overtone 1 octave up (half the volume)
            // Makes the note sound richer, like a real instrument string
            const overtone = ctx.createOscillator();
            overtone.type = 'sine';
            overtone.frequency.value = freq * 2;

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(vol, t);
            oscGain.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.06); // fast decay
            oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            const overtoneGain = ctx.createGain();
            overtoneGain.gain.setValueAtTime(vol * 0.3, t);
            overtoneGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.5);

            // Light reverb via a short delay feedback loop
            const delay = ctx.createDelay(0.3);
            delay.delayTime.value = 0.18;
            const delayGain = ctx.createGain();
            delayGain.gain.value = 0.15;

            osc.connect(oscGain);
            overtone.connect(overtoneGain);
            oscGain.connect(getMasterNode());
            overtoneGain.connect(getMasterNode());
            oscGain.connect(delay);
            delay.connect(delayGain);
            delayGain.connect(getMasterNode());

            osc.start(t);
            osc.stop(t + duration + 0.3);
            overtone.start(t);
            overtone.stop(t + duration * 0.5);
        };

        // C major arpeggio (C5 → E5 → G5 → C6) — universally "win" sounding
        playNote(523.25, 0.00, 0.7, 0.10);  // C5
        playNote(659.25, 0.18, 0.7, 0.10);  // E5
        playNote(783.99, 0.34, 0.7, 0.10);  // G5
        playNote(1046.5, 0.50, 1.2, 0.12);  // C6 — held longer for resolution

        // Subtle card shuffle noise at the moment of victory (feels physical)
        setTimeout(() => {
            try { createShapedNoise(0.18, 900, 4000, 0.10, 0.005); } catch (_) { }
        }, 10);
    } catch (e) { }
};