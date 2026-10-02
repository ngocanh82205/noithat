"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Music, Sparkles, Sliders } from "lucide-react";

// Royalty-free ambient music tracks (loopable)
const MUSIC_TRACKS = {
  milan: {
    label: "Milan Lounge Piano",
    // Bossanova piano - freepd.com royalty free
    src: "https://www.bensound.com/bensound-music/bensound-relaxing.mp3",
  },
  paris: {
    label: "Paris Atelier Jazz",
    src: "https://www.bensound.com/bensound-music/bensound-cute.mp3",
  },
  nordic: {
    label: "Nordic Ambient",
    src: "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3",
  },
};

export default function ShowroomAmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMood, setActiveMood] = useState<"milan" | "paris" | "nordic">("milan");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesize luxury ambient showroom chords using Web Audio API
  const playAmbientChord = (ctx: AudioContext, gain: GainNode, frequencies: number[]) => {
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Soft attack, warm sustain, gentle release
      const now = ctx.currentTime;
      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.exponentialRampToValueAtTime(0.08 * volume, now + 1.2);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

      osc.connect(oscGain);
      oscGain.connect(gain);

      osc.start(now);
      osc.stop(now + 6.0);
    });
  };

  const startShowroomSoundtrack = () => {
    try {
      // Try HTML5 Audio first (real music)
      const track = MUSIC_TRACKS[activeMood];
      if (!audioRef.current) {
        const audio = new Audio(track.src);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
      } else {
        audioRef.current.src = track.src;
        audioRef.current.volume = volume;
      }

      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback to Web Audio API synthesizer
        startSynthFallback();
      });
    } catch (e) {
      startSynthFallback();
    }
  };

  const startSynthFallback = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      if (!gainNodeRef.current) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.connect(ctx.destination);
        gainNodeRef.current = gain;
      }

      const chordProgressions = {
        milan: [
          [146.83, 220.0, 277.18, 329.63, 440.0],
          [185.0, 220.0, 277.18, 369.99, 440.0],
          [196.0, 246.94, 293.66, 369.99, 493.88],
          [220.0, 293.66, 329.63, 440.0, 554.37],
        ],
        paris: [
          [130.81, 196.0, 246.94, 329.63, 392.0],
          [164.81, 196.0, 246.94, 329.63, 493.88],
          [174.61, 220.0, 261.63, 329.63, 392.0],
          [196.0, 261.63, 293.66, 392.0, 493.88],
        ],
        nordic: [
          [110.0, 164.81, 220.0, 261.63, 329.63],
          [130.81, 174.61, 220.0, 261.63, 349.23],
          [146.83, 196.0, 220.0, 293.66, 369.99],
          [164.81, 246.94, 329.63, 392.0, 493.88],
        ],
      };

      let step = 0;
      const playStep = () => {
        if (!gainNodeRef.current || !ctx) return;
        const currentProgression = chordProgressions[activeMood];
        const chord = currentProgression[step % currentProgression.length];
        playAmbientChord(ctx, gainNodeRef.current, chord);
        step++;
      };

      playStep();
      timerRef.current = setInterval(playStep, 5000);
      setIsPlaying(true);
    } catch (e) {
      console.warn("Audio Context init error:", e);
    }
  };

  const stopShowroomSoundtrack = () => {
    // Stop HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Stop synth fallback
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopShowroomSoundtrack();
    } else {
      startShowroomSoundtrack();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      stopShowroomSoundtrack();
      setTimeout(() => startShowroomSoundtrack(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMood]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const currentTrack = MUSIC_TRACKS[activeMood];

  return (
    <aside aria-label="Showroom Ambient Sound" className="fixed bottom-6 left-6 z-40">
      <div className="bg-charcoal/90 backdrop-blur-md text-beige border border-gold/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Compact Bar */}
        <div className="flex items-center space-x-3 px-3.5 py-2.5">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Tắt âm thanh showroom" : "Bật âm thanh showroom"}
            className="w-8 h-8 rounded-full bg-gold/20 hover:bg-gold text-gold hover:text-charcoal flex items-center justify-center transition-colors focus-ring"
            title={isPlaying ? "Tắt âm thanh showroom" : "Bật âm thanh Showroom 5 sao"}
          >
            {isPlaying ? (
              <Volume2 size={16} className="animate-pulse" />
            ) : (
              <VolumeX size={16} />
            )}
          </button>

          <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-serif font-bold text-champagne tracking-wider">
                GS Showroom Audio
              </span>
              {isPlaying && (
                <div className="flex items-end space-x-0.5 h-3">
                  <span className="w-0.5 bg-gold animate-bounce h-2" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 bg-gold animate-bounce h-3" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 bg-gold animate-bounce h-1.5" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
            <span className="text-[9px] text-beige/50 uppercase tracking-widest">
              {isPlaying ? `${currentTrack.label} • Đang phát` : "Nhấn để nghe nhạc Showroom"}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-beige/50 hover:text-gold transition-colors"
            title="Cài đặt âm thanh"
          >
            <Sliders size={13} />
          </button>
        </div>

        {/* Expanded Controls Panel */}
        {isExpanded && (
          <div className="p-3.5 border-t border-gold/20 bg-black/40 space-y-3 animate-fade-in text-xs">
            {/* Mood presets */}
            <div>
              <label className="text-[10px] text-beige/60 uppercase tracking-wider block mb-1.5">
                Không gian âm thanh:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setActiveMood("milan")}
                  className={`py-1 px-2 rounded text-[10px] font-medium transition-colors ${
                    activeMood === "milan"
                      ? "bg-gold text-charcoal font-bold"
                      : "bg-white/5 hover:bg-white/10 text-beige/70"
                  }`}
                >
                  Milan Lounge
                </button>
                <button
                  onClick={() => setActiveMood("paris")}
                  className={`py-1 px-2 rounded text-[10px] font-medium transition-colors ${
                    activeMood === "paris"
                      ? "bg-gold text-charcoal font-bold"
                      : "bg-white/5 hover:bg-white/10 text-beige/70"
                  }`}
                >
                  Paris Atelier
                </button>
                <button
                  onClick={() => setActiveMood("nordic")}
                  className={`py-1 px-2 rounded text-[10px] font-medium transition-colors ${
                    activeMood === "nordic"
                      ? "bg-gold text-charcoal font-bold"
                      : "bg-white/5 hover:bg-white/10 text-beige/70"
                  }`}
                >
                  Nordic Fire
                </button>
              </div>
            </div>

            {/* Volume slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-beige/60">
                <span>Âm lượng</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-gold h-1 bg-white/20 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
