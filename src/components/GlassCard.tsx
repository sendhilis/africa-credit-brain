import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = true }: GlassCardProps) => (
  <div
    className={cn(
      "glass-card p-5 transition-all duration-200",
      hover && "hover:shadow-lg hover:shadow-primary/5",
      className
    )}
  >
    {children}
  </div>
);

export default GlassCard;
