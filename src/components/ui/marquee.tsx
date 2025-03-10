import React, { ReactNode, useEffect, useRef } from "react";

interface MarqueeProps {
  children: ReactNode;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  speed?: number;
  className?: string;
}

export function Marquee({
  children,
  direction = "left",
  pauseOnHover = true,
  speed = 40,
  className = "",
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    
    if (!container || !inner || !inner.firstChild) return;
    
    // Clone children for infinite loop effect
    const content = Array.from(inner.children);
    content.forEach((item) => {
      const clone = item.cloneNode(true);
      inner.appendChild(clone);
    });
    
    const totalWidth = inner.scrollWidth / 2;
    let progress = 0;
    let animationId: number;
    let lastTime = 0;
    let isPaused = false;
    
    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;
      
      if (!isPaused) {
        // Calculate movement based on speed and time delta
        const pixelsPerFrame = (speed * deltaTime) / 1000;
        progress += pixelsPerFrame;
        
        // Reset when we've scrolled through one set of the children
        if (progress >= totalWidth) {
          progress = 0;
        }
        
        // Apply the transform
        const transformValue = direction === "left" 
          ? `translateX(-${progress}px)` 
          : `translateX(${progress}px)`;
        
        inner.style.transform = transformValue;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    const handleMouseEnter = () => {
      if (pauseOnHover) isPaused = true;
    };
    
    const handleMouseLeave = () => {
      isPaused = false;
    };
    
    if (pauseOnHover) {
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    
    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [direction, pauseOnHover, speed]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
    >
      <div
        ref={innerRef}
        className="inline-flex"
        style={{ willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
