
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercentage } from "@/utils/formatters";
import { TrendingUp, TrendingDown, BarChart } from "lucide-react";

interface PerformanceMetricsProps {
  annualizedReturn: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  bestMonth: { month: string; return: number } | null;
  worstMonth: { month: string; return: number } | null;
  maxDrawdown: { percentage: number; startDate: string; endDate: string } | null;
  loading: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  annualizedReturn,
  volatility,
  sharpeRatio,
  bestMonth,
  worstMonth,
  maxDrawdown,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <MetricCard
        title="Annualized Return"
        value={annualizedReturn !== null ? formatPercentage(annualizedReturn) : "N/A"}
        icon={<TrendingUp size={20} />}
        positive={annualizedReturn !== null && annualizedReturn > 0}
      />
      <MetricCard
        title="Volatility"
        value={volatility !== null ? formatPercentage(volatility) : "N/A"}
        icon={<BarChart size={20} />}
        positive={false}
      />
      <MetricCard
        title="Sharpe Ratio"
        value={sharpeRatio !== null ? sharpeRatio.toFixed(2) : "N/A"}
        icon={<BarChart size={20} />}
        positive={sharpeRatio !== null && sharpeRatio > 1}
      />
      <MetricCard
        title="Best Month"
        value={bestMonth ? `${bestMonth.month}: ${formatPercentage(bestMonth.return)}` : "N/A"}
        icon={<TrendingUp size={20} />}
        positive={true}
      />
      <MetricCard
        title="Worst Month"
        value={worstMonth ? `${worstMonth.month}: ${formatPercentage(worstMonth.return)}` : "N/A"}
        icon={<TrendingDown size={20} />}
        positive={false}
      />
      <MetricCard
        title="Max Drawdown"
        value={
          maxDrawdown
            ? `${formatPercentage(maxDrawdown.percentage)} (${maxDrawdown.startDate} - ${maxDrawdown.endDate})`
            : "N/A"
        }
        icon={<TrendingDown size={20} />}
        positive={false}
      />
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  positive: boolean;
}> = ({ title, value, icon, positive }) => {
  return (
    <Card className="p-4 metric-card">
      <div className="flex items-center mb-2">
        <span className={positive ? "text-green-500" : "text-red-500"}>
          {icon}
        </span>
        <h3 className="text-sm font-medium ml-2 text-white">{title}</h3>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
    </Card>
  );
};

export default PerformanceMetrics;
