interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 200, color = '#3b82f6' }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
              <span className="text-gray-600 dark:text-gray-400">{typeof item.value === 'number' ? item.value.toLocaleString('ru-RU') : item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              >
                <span className="text-white text-xs font-semibold">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
