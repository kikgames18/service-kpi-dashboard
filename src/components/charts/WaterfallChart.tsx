interface WaterfallChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function WaterfallChart({ data, height = 200, color = '#3b82f6' }: WaterfallChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((item) => item.value));
  const minValue = Math.min(...data.map((item) => item.value));
  const range = maxValue - minValue || 1;

  const width = 600;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / (data.length * 2);

  let cumulative = 0;

  return (
    <div className="space-y-2">
      <svg width={width} height={height} className="overflow-visible">
        {data.map((item, index) => {
          const x = padding + (index * chartWidth) / data.length + barWidth / 2;
          const startY = padding + chartHeight - ((cumulative - minValue) / range) * chartHeight;
          cumulative += item.value;
          const endY = padding + chartHeight - ((cumulative - minValue) / range) * chartHeight;
          const barHeight = Math.abs(endY - startY);
          const y = Math.min(startY, endY);

          return (
            <g key={index}>
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className="transition-opacity hover:opacity-80"
              />
              <text
                x={x}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {item.value.toLocaleString('ru-RU')} ₽
              </text>
              <text
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

