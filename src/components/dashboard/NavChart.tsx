
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { MonthlyNav } from "@/services/navService";

interface NavChartProps {
  navData: MonthlyNav[];
  loading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const NavChart = ({ navData, loading }: NavChartProps) => {
  const chartData = navData.map(item => ({
    date: format(new Date(item.month_end_date), 'MMM yyyy'),
    value: item.total_nav
  }));

  return (
    <Card className="p-6 metric-card">
      <h2 className="text-lg font-semibold mb-4 text-white">NAV Performance</h2>
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      ) : chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "NAV"]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(39, 20, 69, 0.9)',
                  borderColor: 'rgba(151, 222, 244, 0.2)',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="rgb(151, 222, 244)"
                strokeWidth={2}
                dot={{ fill: 'rgb(151, 222, 244)', strokeWidth: 1, r: 4 }}
                activeDot={{ r: 6, fill: 'rgb(178, 247, 245)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          No NAV data available
        </div>
      )}
    </Card>
  );
};

export default NavChart;
