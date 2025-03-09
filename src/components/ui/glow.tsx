
import { cn } from "@/lib/utils";

interface GlowProps {
  variant?: "bottom" | "top" | "left" | "right" | "center";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Glow({ variant = "center", size = "md", className }: GlowProps) {
  const variantClasses = {
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    top: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    bottom: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  };

  const sizeClasses = {
    sm: "h-[200px] w-[200px] sm:h-[300px] sm:w-[300px]",
    md: "h-[300px] w-[300px] sm:h-[500px] sm:w-[500px]",
    lg: "h-[500px] w-[500px] sm:h-[800px] sm:w-[800px]",
  };

  return (
    <div
      className={cn(
        "absolute z-0 rounded-full bg-cnstrct-orange/20 blur-[100px]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    />
  );
}
