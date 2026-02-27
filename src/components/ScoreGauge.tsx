interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
  band?: string;
}

const ScoreGauge = ({ score, maxScore = 900, size = 180, label, band }: ScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return "hsl(var(--success))";
    if (percentage >= 40) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          className="fill-foreground font-display text-3xl font-bold"
          style={{ fontSize: size * 0.18 }}
        >
          {score}
        </text>
        {band && (
          <text
            x={size / 2}
            y={size / 2 + 15}
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
            style={{ fontSize: size * 0.065 }}
          >
            {band}
          </text>
        )}
      </svg>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
};

export default ScoreGauge;
