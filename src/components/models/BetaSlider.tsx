import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BetaSliderProps {
  featureKey: string;
  label: string;
  originalBeta: number;
  currentBeta: number;
  onChange: (key: string, value: number) => void;
  onReset: (key: string) => void;
}

const BetaSlider = ({ featureKey, label, originalBeta, currentBeta, onChange, onReset }: BetaSliderProps) => {
  const isModified = Math.abs(currentBeta - originalBeta) > 0.001;
  const minBeta = Math.min(originalBeta * 3, originalBeta * -1);
  const maxBeta = Math.max(originalBeta * 3, originalBeta * -1);
  const range = maxBeta - minBeta;
  // Ensure a reasonable range
  const safeMin = range < 0.1 ? -2 : minBeta;
  const safeMax = range < 0.1 ? 2 : maxBeta;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{label}</span>
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`font-mono text-[10px] font-semibold ${isModified ? "text-warning" : "text-muted-foreground/70"}`}>
                  β={currentBeta > 0 ? "+" : ""}{currentBeta.toFixed(2)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>Original: β={originalBeta > 0 ? "+" : ""}{originalBeta.toFixed(2)}</p>
                {isModified && (
                  <p className="text-warning">
                    Δ = {(currentBeta - originalBeta) > 0 ? "+" : ""}{(currentBeta - originalBeta).toFixed(2)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isModified && (
            <button
              onClick={() => onReset(featureKey)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Reset to original"
            >
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
      <Slider
        value={[currentBeta]}
        min={safeMin}
        max={safeMax}
        step={0.01}
        onValueChange={([v]) => onChange(featureKey, v)}
        className="py-1"
      />
      <div className="flex justify-between text-[8px] text-muted-foreground/50 font-mono">
        <span>{safeMin.toFixed(1)}</span>
        <span>{safeMax.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default BetaSlider;
