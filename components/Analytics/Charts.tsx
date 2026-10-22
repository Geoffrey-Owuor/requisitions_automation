"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_INK,
  ChartTooltip,
  formatCount,
  formatMonth,
} from "./AnalyticsPrimitives";

// The Recharts charts the dashboards share. Each takes its series as
// { key, label, color } so a dashboard picks the measure (headcount, KES)
// while the chart keeps one look. Wrap them in a ChartCard, passing the
// same series as its legend.

export type ChartSeries<Row> = {
  key: keyof Row & string;
  label: string;
  color: string;
};

const axisProps = {
  stroke: CHART_INK.baseline,
  tick: { fill: CHART_INK.axis, fontSize: 12 },
  tickLine: false,
} as const;

// Side-by-side bars per calendar month (`month` is YYYY-MM)
export function MonthlyBars<Row extends { month: string }>({
  data,
  series,
  formatValue = formatCount,
  formatAxis = formatCount,
}: {
  data: Row[];
  series: ChartSeries<Row>[];
  formatValue?: (value: number) => string;
  formatAxis?: (value: number) => string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barGap={2}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          <XAxis dataKey="month" tickFormatter={formatMonth} {...axisProps} />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            width={48}
            tickFormatter={formatAxis}
            {...axisProps}
          />
          <Tooltip
            cursor={{ fill: CHART_INK.cursor }}
            content={
              <ChartTooltip
                formatLabel={(month) => formatMonth(String(month))}
                formatValue={formatValue}
              />
            }
          />
          {series.map(({ key, label, color }) => (
            <Bar
              key={key}
              dataKey={key as string}
              name={label}
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// One stacked horizontal bar per department, grown to fit the list
export function DepartmentBars<Row extends { department: string }>({
  data,
  series,
  formatValue = formatCount,
  formatAxis = formatCount,
}: {
  data: Row[];
  series: ChartSeries<Row>[];
  formatValue?: (value: number) => string;
  formatAxis?: (value: number) => string;
}) {
  return (
    <div style={{ height: Math.max(120, data.length * 36 + 32) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
          <XAxis
            type="number"
            allowDecimals={false}
            tickFormatter={formatAxis}
            {...axisProps}
          />
          <YAxis
            type="category"
            dataKey="department"
            width={140}
            axisLine={false}
            {...axisProps}
          />
          <Tooltip
            cursor={{ fill: CHART_INK.cursor }}
            content={<ChartTooltip formatValue={formatValue} />}
          />
          {series.map(({ key, label, color }, index) => (
            <Bar
              key={key}
              dataKey={key as string}
              name={label}
              stackId="stack"
              fill={color}
              stroke="#ffffff"
              strokeWidth={2}
              // Only the outer end of the stack is rounded
              radius={index === series.length - 1 ? [0, 4, 4, 0] : 0}
              maxBarSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
