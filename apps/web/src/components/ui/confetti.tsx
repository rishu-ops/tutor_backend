'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

const COLORS = [
  '#00A453', // Brand Green
  '#004fcb', // Brand Blue
  '#ffc107', // Amber Yellow
  '#ff4757', // Coral Red
  '#2ed573', // Neon Green
  '#1e90ff', // Dodger Blue
  '#ffa502', // Orange
];

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const arr: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100, // percentage
        y: -10 - Math.random() * 20, // start above viewport
        size: 5 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
        rotation: Math.random() * 360,
      });
    }
    setPieces(arr);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-[2px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0.8,
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0);
            opacity: 1;
          }
          50% {
            translatex: 20px;
          }
          100% {
            transform: translateY(105vh) rotate(720deg) translateX(-20px);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
