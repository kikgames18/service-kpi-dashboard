interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 200, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const segmentLength = (item.value / total) * circumference;
    const offset = currentOffset;
    currentOffset += segmentLength;

    return {
      ...item,
      percentage: percentage.toFixed(1),
      segmentLength,
      offset,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.segmentLength} ${circumference}`}
              strokeDashoffset={-segment.offset}
              className="transition-all hover:opacity-80"
            />
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <div className="text-3xl font-bold text-gray-900">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-sm text-gray-600">{centerLabel}</div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: segment.color }} />
            <span className="text-sm text-gray-700">
              {segment.label}: {segment.value} ({segment.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
