
import React from "react";
import { cn } from "@/lib/utils";

interface MockupProps {
  children: React.ReactNode;
  type?: "responsive" | "window" | "browser";
  className?: string;
}

export function Mockup({ children, type = "responsive", className }: MockupProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border shadow-md", className)}>
      {type === "browser" && (
        <div className="flex items-center border-b bg-muted/40 px-4 py-2">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="mx-auto">
            <div className="h-6 w-60 rounded-lg bg-muted/20" />
          </div>
        </div>
      )}
      {type === "window" && (
        <div className="flex items-center border-b bg-muted/40 px-4 py-2">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        </div>
      )}
      <div className="bg-background">{children}</div>
    </div>
  );
}

interface MockupFrameProps {
  children: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large";
}

export function MockupFrame({ children, className, size = "medium" }: MockupFrameProps) {
  const sizeClasses = {
    small: "max-w-3xl",
    medium: "max-w-4xl",
    large: "max-w-5xl",
  };

  return (
    <div className={cn("mx-auto w-full", sizeClasses[size], className)}>
      {children}
    </div>
  );
}
