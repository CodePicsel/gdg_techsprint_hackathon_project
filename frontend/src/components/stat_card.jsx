import { useState, useEffect } from "react";

const StatCard = ({
  label,
  value,
  unit,
  icon, // pass emoji or inline SVG component
  trend,
  status = "normal",
  showSync = true
}) => {
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLastSync(0);
      } else {
        setLastSync(prev => Math.min(prev + 1, 10));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusStyles = {
    normal: "bg-blue-500/10 border-blue-500/30 text-blue-500",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    error: "bg-red-500/10 border-red-500/30 text-red-500"
  };

  return (
    <div className="stat_card rounded-xl border border-white/10 bg-black/40 p-4 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div
          className={`p-2 border rounded-md ${statusStyles[status]}`}
        >
          <span className="text-sm">{icon}</span>
        </div>

        {trend && (
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded
              ${trend.positive
                ? "text-green-500 bg-green-500/10"
                : "text-red-500 bg-red-500/10"}
            `}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-white">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-gray-400">{unit}</span>
          )}
        </div>
      </div>

      {/* Sync */}
      {showSync && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
          <span
            className={`text-xs ${
              lastSync === 0 ? "animate-spin" : ""
            }`}
          >
            ⟳
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            {lastSync === 0 ? "syncing..." : `${lastSync}s ago`}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
