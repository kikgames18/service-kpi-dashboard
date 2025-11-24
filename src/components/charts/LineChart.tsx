interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 200, color = '#3b82f6' }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((item) => item.value));
  const minValue = Math.min(...data.map((item) => item.value));
  const range = maxValue - minValue || 1;

  const width = 600;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, value: item.value };
  });

  const pathData = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${point.x} ${point.y}`;
  }).join(' ');

  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="space-y-2">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <path
          d={areaPathData}
          fill="url(#areaGradient)"
        />

        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="3"
              className="transition-all hover:r-7"
            />
          </g>
        ))}

        {data.map((item, index) => {
          const point = points[index];
          return (
            <text
              key={index}
              x={point.x}
              y={height - padding + 25}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
