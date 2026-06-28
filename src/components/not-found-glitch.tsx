"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TARGET = "404";
const GLYPHS = "▓▒░4Ø40#%@/\\<>".split("");

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
}

// Big serif "404" that scrambles through random glyphs then settles. Runs once
// on mount and re-fires on hover. Layout is held steady (fixed-width slots) so
// glyph swaps never shift the page.
export function NotFoundGlitch({ className }: { className?: string }) {
  const [chars, setChars] = useState<string[]>(() => TARGET.split(""));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const scramble = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    let frame = 0;
    const totalFrames = 12; // ~600ms at 50ms/frame
    timer.current = setInterval(() => {
      frame += 1;
      // Each character locks to its target progressively across the run.
      const settledCount = Math.floor((frame / totalFrames) * TARGET.length);
      setChars(
        TARGET.split("").map((target, i) =>
          i < settledCount ? target : randomGlyph(),
        ),
      );
      if (frame >= totalFrames) {
        setChars(TARGET.split(""));
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scramble();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [scramble]);

  return (
    <button
      type="button"
      aria-label="404"
      onMouseEnter={scramble}
      onFocus={scramble}
      className={cn(
        "cursor-default select-none font-serif leading-none text-primary",
        "text-[9rem] sm:text-[12rem]",
        "transition-[text-shadow] duration-200 hover:[text-shadow:0_0_24px_var(--primary)]",
        className,
      )}
    >
      <span aria-hidden className="tabular-nums tracking-tight">
        {chars.map((c, i) => (
          // Fixed-width slot keeps glyph swaps from shifting layout.
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length 3-slot display
            key={i}
            className="inline-block w-[0.62em] text-center"
          >
            {c}
          </span>
        ))}
      </span>
    </button>
  );
}
