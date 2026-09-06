"use client";

import { useEffect, useRef, useState } from "react";

export function MusicPlayer({ musicUrl, autoPlay = true }: { musicUrl: string; autoPlay?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!musicUrl) return;
    
    // Create audio instance if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
    }

    if (autoPlay) {
      const handleFirstInteraction = () => {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.warn("Audio autoplay prevented by browser:", err);
          });
        }
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('scroll', handleFirstInteraction);
      };

      document.addEventListener('click', handleFirstInteraction);
      document.addEventListener('touchstart', handleFirstInteraction);
      document.addEventListener('scroll', handleFirstInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('scroll', handleFirstInteraction);
      };
    }
  }, [musicUrl, autoPlay]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  if (!musicUrl) return null;

  return (
    <button
      onClick={togglePlay}
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#241f1a]/80 text-[#f7f3ed] backdrop-blur-sm transition-transform hover:scale-105 shadow-lg border border-[#e0d4c7]/20 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}
      aria-label={isPlaying ? "Pause Music" : "Play Music"}
    >
      {isPlaying ? (
        <span className="text-xl animate-pulse">♪</span>
      ) : (
        <span className="text-xl opacity-60">♪</span>
      )}
    </button>
  );
}
