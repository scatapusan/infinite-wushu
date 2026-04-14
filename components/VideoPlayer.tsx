"use client";

import { Play, Repeat } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  videoUrl: string | null;
  title?: string;
};

function parseYouTube(url: string): { id: string; start: number | null } | null {
  const idMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (!idMatch) return null;
  const tMatch = url.match(/[?&]t=(\d+)/);
  return { id: idMatch[1], start: tMatch ? parseInt(tMatch[1], 10) : null };
}

export default function VideoPlayer({ videoUrl, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);

  if (!videoUrl) {
    return (
      <div className="relative overflow-hidden rounded-card-md border border-white/10 bg-[#0a0f20]">
        <div className="relative flex aspect-video items-center justify-center">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7rem] font-bold text-cyan/[0.04]"
            style={{ fontFamily: "var(--font-chinese), serif" }}
          >
            武学
          </span>
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
              <Play size={22} className="ml-1 text-cyan" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan/70">
              Demo video — coming soon
            </p>
            {title && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30">
                {title}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const yt = parseYouTube(videoUrl);

  if (yt) {
    const embedSrc = `https://www.youtube.com/embed/${yt.id}?rel=0${yt.start ? `&start=${yt.start}` : ""}`;
    return (
      <div>
        <div className="overflow-hidden rounded-card-md border border-white/10">
          <iframe
            src={embedSrc}
            title={title ?? "Technique video"}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-foreground/40">
          Use YouTube ⚙️ for 0.25x slow motion
        </p>
      </div>
    );
  }

  // Native video fallback
  const applySpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };
  const toggleLoop = () => {
    const next = !loop;
    setLoop(next);
    if (videoRef.current) videoRef.current.loop = next;
  };

  return (
    <div className="overflow-hidden rounded-card-md border border-white/10 bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="aspect-video w-full"
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0a0f20] px-3 py-2">
        <span className="text-[10px] uppercase tracking-[0.15em] text-foreground/40">
          Speed
        </span>
        {[0.25, 0.5, 1].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applySpeed(s)}
            className={`rounded-card-sm px-2 py-1 text-xs font-semibold transition ${
              speed === s
                ? "bg-cyan/20 text-cyan"
                : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {s}x
          </button>
        ))}
        <button
          type="button"
          onClick={toggleLoop}
          className={`ml-auto inline-flex items-center gap-1 rounded-card-sm px-2 py-1 text-xs font-semibold transition ${
            loop
              ? "bg-cyan/20 text-cyan"
              : "text-foreground/50 hover:text-foreground/80"
          }`}
        >
          <Repeat size={12} />
          Loop
        </button>
      </div>
    </div>
  );
}
