interface StackedBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  colors?: string[];
}

export function StackedBarChart({ data, height = 200, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }: StackedBarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((item) => item.value));
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const width = 600;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length * 0.6;
  const barSpacing = chartWidth / data.length * 0.4;

  return (
    <div className="space-y-2">
      <svg width={width} height={height} className="overflow-visible">
        {data.map((item, index) => {
          const x = padding + (index * (barWidth + barSpacing)) + barSpacing / 2;
          const barHeight = (item.value / maxValue) * chartHeight;
          const y = padding + chartHeight - barHeight;
          const color = colors[index % colors.length];

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                className="transition-opacity hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400 font-medium"
              >
                {item.value.toLocaleString('ru-RU')} ₽
              </text>
              <text
                x={x + barWidth / 2}
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

