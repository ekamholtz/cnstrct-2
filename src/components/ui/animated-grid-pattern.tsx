import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGridPatternProps {
  className?: string;
  speed?: number;
  lineColor?: string;
  dotColor?: string;
  lineOpacity?: number;
  dotOpacity?: number;
  size?: number;
  dotSize?: number;
  opacity?: number;
}

export const AnimatedGridPattern = ({
  className,
  speed = 0.5,
  lineColor = "rgba(255, 255, 255, 0.2)",
  dotColor = "rgba(255, 255, 255, 0.4)",
  lineOpacity = 0.2,
  dotOpacity = 0.4,
  size = 30,
  dotSize = 1.5,
  opacity,
}: AnimatedGridPatternProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      if (!canvas || !ctx) return;

      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      // Update offset for animation
      offsetRef.current += speed;
      if (offsetRef.current >= size) {
        offsetRef.current = 0;
      }

      // Apply global opacity if provided
      const effectiveLineOpacity = opacity !== undefined ? opacity * 0.5 : lineOpacity;
      const effectiveDotOpacity = opacity !== undefined ? opacity : dotOpacity;

      // Draw grid lines
      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = effectiveLineOpacity;
      ctx.lineWidth = 1;

      // Horizontal lines
      for (let y = offsetRef.current % size; y < height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical lines
      for (let x = offsetRef.current % size; x < width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw dots at intersections
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = effectiveDotOpacity;

      for (let x = offsetRef.current % size; x < width; x += size) {
        for (let y = offsetRef.current % size; y < height; y += size) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [speed, lineColor, dotColor, lineOpacity, dotOpacity, size, dotSize, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 w-full h-full -z-10", className)}
    />
  );
};
