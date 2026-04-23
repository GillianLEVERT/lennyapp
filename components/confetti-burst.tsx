"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";

type ConfettiPiece = {
  id: string;
  color: string;
  left: string;
  delay: string;
  duration: string;
  drift: string;
  rotate: string;
  size: string;
  shape: string;
};

const CONFETTI_COLORS = ["#2E5BFF", "#FF4D63", "#FFD447", "#2CCB73", "#FFFFFF"];

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    if (!burstKey) {
      return [];
    }

    return Array.from({ length: 30 }, (_, index) => {
      const size = 8 + (index % 5) * 2;

      return {
        id: `${burstKey}-${index}`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        left: `${4 + ((index * 13) % 92)}%`,
        delay: `${(index % 6) * 35}ms`,
        duration: `${1600 + (index % 7) * 120}ms`,
        drift: `${-40 + (index % 9) * 10}px`,
        rotate: `${index * 39}deg`,
        size: `${size}px`,
        shape: index % 3 === 0 ? "999px" : "4px",
      };
    });
  }, [burstKey]);

  if (!pieces.length) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="celebration-piece"
          style={
            {
              left: piece.left,
              width: piece.size,
              height: `calc(${piece.size} * 1.7)`,
              backgroundColor: piece.color,
              borderRadius: piece.shape,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              transform: `translate3d(0, -8vh, 0) rotate(${piece.rotate})`,
              "--confetti-x": piece.drift,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
