
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercentage } from "@/utils/formatters";
import { TrendingUp, TrendingDown, BarChart } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <TooltipProvider>
        <MetricCard
          title="Annualized Return"
          value={annualizedReturn !== null ? formatPercentage(annualizedReturn) : "N/A"}
          icon={<TrendingUp size={20} />}
          positive={annualizedReturn !== null && annualizedReturn > 0}
          tooltip="The average annual return of the fund over its lifetime"
        />
        <MetricCard
          title="Volatility"
          value={volatility !== null ? formatPercentage(volatility) : "N/A"}
          icon={<BarChart size={20} />}
          positive={false}
          tooltip="The standard deviation of the fund's monthly returns, a measure of risk"
        />
        <MetricCard
          title="Sharpe Ratio"
          value={sharpeRatio !== null ? sharpeRatio.toFixed(2) : "N/A"}
          icon={<BarChart size={20} />}
          positive={sharpeRatio !== null && sharpeRatio > 1}
          tooltip="A measure of risk-adjusted return (higher is better)"
        />
        <MetricCard
          title="Best Month"
          value={bestMonth ? `${bestMonth.month}: ${formatPercentage(bestMonth.return)}` : "N/A"}
          icon={<TrendingUp size={20} />}
          positive={true}
          tooltip="The month with the highest return"
        />
        <MetricCard
          title="Worst Month"
          value={worstMonth ? `${worstMonth.month}: ${formatPercentage(worstMonth.return)}` : "N/A"}
          icon={<TrendingDown size={20} />}
          positive={false}
          tooltip="The month with the lowest return"
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
          tooltip="The largest peak-to-trough decline in fund value"
        />
      </TooltipProvider>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  positive: boolean;
  tooltip: string;
}> = ({ title, value, icon, positive, tooltip }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="p-4 metric-card hover:bg-white/5 transition-colors">
          <div className="flex items-center mb-2">
            <span className={positive ? "text-green-500" : "text-red-500"}>
              {icon}
            </span>
            <h3 className="text-sm font-medium ml-2 text-white">{title}</h3>
          </div>
          <p className="text-xl font-semibold text-white">{value}</p>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PerformanceMetrics;
