
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MonthlyNav } from "@/services/dataService";
import { prepareChartData } from "@/services/performanceService";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface PerformanceChartProps {
  navData: MonthlyNav[];
  loading: boolean;
}

type TimePeriod = "ytd" | "1y" | "3y" | "all";

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  navData,
  loading,
}) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  // Filter data based on selected time period
  const filteredData = React.useMemo(() => {
    if (!navData.length) return [];
    
    const now = new Date();
    const sortedData = [...navData].sort(
      (a, b) => new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
    );
    
    switch (timePeriod) {
      case "ytd":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return sortedData.filter(
          (item) => new Date(item.month_end_date) >= startOfYear
        );
      case "1y":
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return sortedData.filter(
          (item) => new Date(item.month_end_date) >= oneYearAgo
        );
      case "3y":
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(now.getFullYear() - 3);
        return sortedData.filter(
          (item) => new Date(item.month_end_date) >= threeYearsAgo
        );
      case "all":
      default:
        return sortedData;
    }
  }, [navData, timePeriod]);

  const chartData = prepareChartData(filteredData);

  if (loading) {
    return (
      <Card className="p-6 metric-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">NAV Performance</h2>
          <Skeleton className="h-10 w-[250px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 metric-card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">NAV Performance</h2>
        <Tabs
          defaultValue="all"
          value={timePeriod}
          onValueChange={(value) => setTimePeriod(value as TimePeriod)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="ytd">YTD</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="3y">3Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-[400px] w-full mt-4">
        {chartData.length > 0 ? (
          <ChartContainer
            config={{
              nav: {
                label: "NAV",
                color: "#97DEF4",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#97DEF4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#97DEF4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#E8F1F8' }} 
                  tickLine={{ stroke: '#E8F1F8' }}
                  axisLine={{ stroke: '#E8F1F8' }}
                />
                <YAxis 
                  tick={{ fill: '#E8F1F8' }} 
                  tickLine={{ stroke: '#E8F1F8' }}
                  axisLine={{ stroke: '#E8F1F8' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded bg-primary"></div>
                              <span className="font-medium text-white">
                                {payload[0].payload.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                NAV:
                              </span>
                              <span className="font-medium text-white">
                                ${(payload[0].value as number).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="nav"
                  stroke="#97DEF4"
                  fillOpacity={1}
                  fill="url(#navGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-white">
            No performance data available for the selected time period
          </div>
        )}
      </div>
    </Card>
  );
};

export default PerformanceChart;
