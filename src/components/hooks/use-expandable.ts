
import { useMotionValue } from "framer-motion";
import { useState } from "react";

export function useExpandable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useMotionValue(0);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return { isExpanded, toggleExpand, animatedHeight };
}
