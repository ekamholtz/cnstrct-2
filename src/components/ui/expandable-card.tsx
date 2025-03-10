import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
  expandedClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  expandedContentClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ExpandableCard = React.forwardRef<HTMLDivElement, ExpandableCardProps>(
  ({ 
    children, 
    expandedContent, 
    className, 
    expandedClassName, 
    headerClassName, 
    contentClassName, 
    expandedContentClassName,
    onClick,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const toggleExpand = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    };

    const handleClick = (e: React.MouseEvent) => {
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl relative bg-white/10 backdrop-blur-sm border border-white/20 shadow-md transition-all duration-300",
          isExpanded && "shadow-lg",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className={cn("p-4", headerClassName)}>
          {children}
          <button
            onClick={toggleExpand}
            className="absolute bottom-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
            expandedContentClassName
          )}
        >
          <div className={cn("p-4 pt-0 border-t border-white/10", contentClassName)}>
            {expandedContent}
          </div>
        </div>
      </div>
    );
  }
);

ExpandableCard.displayName = "ExpandableCard";
