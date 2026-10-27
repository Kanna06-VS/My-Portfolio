type BookSound = { play(durationSeconds?: number, cover?: boolean): void; stop(): void };
type SoundVoice = { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };

/** A quiet paper rustle, generated locally and started only by a book interaction. */
export function createProjectBookSound(button: HTMLButtonElement | null): BookSound {
    const AudioContextType = window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const silent: BookSound = { play() {}, stop() {} };
    if (!button || !AudioContextType) {
        if (button) button.hidden = true;
        return silent;
    }

    const preferenceKey = "portfolio-book-sound";
    let enabled = true;
    try { enabled = localStorage.getItem(preferenceKey) !== "off"; } catch { /* Storage is optional. */ }
    let context: AudioContext | null = null;
    let paper: AudioBuffer | null = null;
    let generation = 0;
    const voices = new Set<SoundVoice>();

    function updateButton(): void {
        button!.hidden = false;
        button!.setAttribute("aria-label", "Page-turn sound");
        button!.setAttribute("aria-pressed", String(enabled));
        button!.dataset.soundEnabled = String(enabled);
        button!.title = enabled ? "Mute page-turn sound" : "Enable page-turn sound";
    }

    function stop(): void {
        generation += 1;
        voices.forEach(({ source, gain }) => {
            try {
                const now = source.context.currentTime;
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.025);
                source.stop(now + 0.03);
            } catch { /* A completed or interrupted sound is already silent. */ }
        });
        voices.clear();
    }

    function createPaperBuffer(audio: AudioContext): AudioBuffer {
        const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 2), audio.sampleRate);
        const samples = buffer.getChannelData(0);
        let pink = 0;
        let brown = 0;
        let grain = 0.7;
        let peak = 0;
        for (let index = 0; index < samples.length; index += 1) {
            const white = Math.random() * 2 - 1;
            pink = pink * 0.97 + white * 0.03;
            brown = brown * 0.995 + white * 0.005;
            // Fine irregular flutter suggests paper fibres brushing across one another.
            grain = grain * 0.995 + Math.random() * 0.005;
            const time = index / audio.sampleRate;
            const flutter = 0.68 + 0.2 * Math.sin(time * 183 + Math.sin(time * 31)) +
                0.12 * Math.sin(time * 439);
            const value = (white * 0.46 + pink * 2.5 + brown * 2) * flutter * grain;
            samples[index] = value;
            peak = Math.max(peak, Math.abs(value));
        }
        const scale = peak > 0 ? 0.9 / peak : 1;
        for (let index = 0; index < samples.length; index += 1) samples[index] *= scale;
        return buffer;
    }

    function startVoice(audio: AudioContext, duration: number, cover: boolean): void {
        if (!paper) return;
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        const voice = { source, filter, gain };
        const now = audio.currentTime;
        const level = cover ? 0.22 : 0.32;
        source.buffer = paper;
        source.playbackRate.value = 0.94 + Math.random() * 0.12;
        filter.type = "bandpass";
        filter.Q.value = 0.45;
        filter.frequency.setValueAtTime(cover ? 600 : 1050, now);
        filter.frequency.linearRampToValueAtTime(cover ? 1350 : 2800, now + duration * 0.35);
        filter.frequency.linearRampToValueAtTime(cover ? 700 : 1300, now + duration);
        // Two soft swishes follow the lift and settling of a turning sheet.
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(level, now + duration * 0.16);
        gain.gain.linearRampToValueAtTime(level * 0.38, now + duration * 0.43);
        gain.gain.linearRampToValueAtTime(level * 0.8, now + duration * 0.64);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        source.onended = () => {
            voices.delete(voice);
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
        voices.add(voice);
        try {
            source.start(now, Math.random() * 0.4);
            source.stop(now + duration + 0.01);
        } catch {
            voices.delete(voice);
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
        }
    }

    function play(durationSeconds = 0.85, cover = false): void {
        if (!enabled || document.hidden) return;
        stop();
        const request = generation;
        const duration = Number.isFinite(durationSeconds) ?
            Math.min(1.1, Math.max(0.3, durationSeconds)) : 0.85;
        try {
            context ??= new AudioContextType();
            paper ??= createPaperBuffer(context);
            const audio = context;
            const start = () => {
                if (request !== generation || !enabled || document.hidden || audio.state !== "running") return;
                try { startVoice(audio, duration, cover); } catch { /* Sound never blocks a page turn. */ }
            };
            if (audio.state === "running") start();
            else void audio.resume().then(start).catch(() => { /* Autoplay restrictions are respected. */ });
        } catch { /* Audio is optional when unavailable or blocked. */ }
    }

    button.addEventListener("click", () => {
        enabled = !enabled;
        if (!enabled) stop();
        try { localStorage.setItem(preferenceKey, enabled ? "on" : "off"); } catch { /* Optional persistence. */ }
        updateButton();
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    window.addEventListener("pagehide", stop);
    updateButton();
    return { play, stop };
}
