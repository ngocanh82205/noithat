"use client";

import { useState } from "react";

export type DonutSegment = {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  subText?: string;
};

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutSegment[];
  totalLabel?: string;
  totalValue?: string | number;
  formatValue?: (val: number) => string;
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({
  title,
  subtitle,
  data,
  totalLabel = "Tổng cộng",
  totalValue,
  formatValue,
  size = 220,
  strokeWidth = 32,
}: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter valid data items
  const validData = data.filter((d) => d.value > 0);
  const total = validData.reduce((acc, curr) => acc + curr.value, 0);

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const segmentsWithAngles = validData.map((item) => {
    const percent = total > 0 ? (item.value / total) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      ...item,
      computedPercent: percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem = hoveredKey ? segmentsWithAngles.find((d) => d.key === hoveredKey) : null;

  return (
    <div className="bg-charcoal/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-gold/30">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="font-serif text-base lg:text-lg text-champagne tracking-wide flex items-center gap-2">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-beige/50 mt-0.5">{subtitle}</p>}
        </div>
        {activeItem && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border border-gold/40 bg-gold/10 text-gold animate-fade-in">
            {activeItem.label}
          </span>
        )}
      </div>

      {/* Main Chart Area */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 origin-center transition-transform duration-500"
          >
            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segments */}
            {segmentsWithAngles.length === 0 ? (
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
            ) : (
              segmentsWithAngles.map((seg) => {
                const isHovered = hoveredKey === seg.key;
                return (
                  <circle
                    key={seg.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      opacity: hoveredKey && !isHovered ? 0.35 : 1,
                      filter: isHovered ? `drop-shadow(0 0 10px ${seg.color})` : "none",
                    }}
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Center Dynamic Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            {activeItem ? (
              <>
                <span className="text-[10px] uppercase tracking-widest2 text-beige/50 mb-0.5 truncate max-w-[120px]">
                  {activeItem.label}
                </span>
                <span className="font-serif text-xl font-bold text-gold">
                  {formatValue ? formatValue(activeItem.value) : activeItem.value}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                  {activeItem.computedPercent.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-widest2 text-beige/50 mb-0.5">
                  {totalLabel}
                </span>
                <span className="font-serif text-2xl font-bold text-champagne">
                  {totalValue !== undefined
                    ? totalValue
                    : formatValue
                    ? formatValue(total)
                    : total}
                </span>
                <span className="text-[10px] text-beige/40 mt-0.5">
                  {validData.length} phân mục
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2.5 max-w-xs">
          {data.map((seg) => {
            const isHovered = hoveredKey === seg.key;
            return (
              <div
                key={seg.key}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                  isHovered
                    ? "bg-white/10 border-gold/40 scale-[1.02]"
                    : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: seg.color,
                      boxShadow: isHovered ? `0 0 8px ${seg.color}` : "none",
                      transform: isHovered ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs truncate transition-colors ${
                        isHovered ? "text-gold font-semibold" : "text-beige/80"
                      }`}
                    >
                      {seg.label}
                    </p>
                    {seg.subText && (
                      <p className="text-[10px] text-beige/40 truncate">{seg.subText}</p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-medium text-beige">
                    {formatValue ? formatValue(seg.value) : seg.value}
                  </span>
                  <span className="block text-[10px] text-beige/50 font-mono">
                    {seg.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
