
import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps { 
  title: string; 
  value: string | number | null; 
  icon: React.ReactNode; 
  trend: number | null; 
  trendLabel: string;
  loading?: boolean;
}

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel,
  loading = false
}: MetricCardProps) => {
  const isPositive = trend !== null ? trend >= 0 : false;
  
  return (
    <Card className="p-6 metric-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1 text-white">{value}</p>
          )}
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-24 mt-4" />
      ) : (
        trend !== null && (
          <div className="mt-4 flex items-center space-x-2">
            {isPositive ? (
              <ArrowUp className="w-4 h-4 text-success-DEFAULT" />
            ) : (
              <ArrowDown className="w-4 h-4 text-danger-DEFAULT" />
            )}
            <span className={`text-sm font-medium ${
              isPositive ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
            }`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-400">{trendLabel}</span>
          </div>
        )
      )}
    </Card>
  );
};

export default MetricCard;
