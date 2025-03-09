
import { useState, useRef } from "react";
import { useMotionValue } from "framer-motion";

export function useExpandable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useMotionValue(0);
  
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return {
    isExpanded,
    toggleExpand,
    animatedHeight
  };
}
