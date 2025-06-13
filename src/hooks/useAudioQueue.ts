import { useRef } from 'react';

export function useAudioQueue() {
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const enqueue = (text: string) => {
    queueRef.current.push(text);
    if (!isPlayingRef.current) {
      playNext();
    }
  };

  const playNext = async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;

    const nextText = queueRef.current.shift();
    if (!nextText) {
      isPlayingRef.current = false;
      return;
    }

    try {
      // ✅ Prefetch audio BEFORE playing anything else
      const audio = await fetchAndCreateAudio(nextText);
      audio.onended = () => playNext();
      audio.onerror = () => playNext();
      audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      playNext(); // Skip and move on
    }
  };

  const fetchAndCreateAudio = async (text: string): Promise<HTMLAudioElement> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    return new Audio(audioUrl);
  };

  return { enqueue };
}
