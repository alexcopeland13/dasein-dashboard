
import { useState } from "react";
import { Card } from "@/components/ui/card";
import DashboardNav from "@/components/nav/DashboardNav";
import { Line } from "recharts";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";

// Mock data for initial development
const navData = [
  { date: "2023-08", value: 1000000 },
  { date: "2023-09", value: 1050000 },
  { date: "2023-10", value: 1150000 },
  { date: "2023-11", value: 1200000 },
  { date: "2023-12", value: 1180000 },
  { date: "2024-01", value: 1250000 },
];

const Index = () => {
  const [currentNav, setCurrentNav] = useState(1250000);
  const monthlyReturn = 5.93;
  const ytdReturn = 25.0;
  const totalInvestors = 24;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="ml-64 p-8 animate-fade-up">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Fund performance and metrics overview</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Current NAV"
              value={`$${(currentNav / 1000000).toFixed(2)}M`}
              icon={<BarChart3 className="w-6 h-6" />}
              trend={monthlyReturn}
              trendLabel="vs last month"
            />
            <MetricCard
              title="YTD Return"
              value={`${ytdReturn.toFixed(1)}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={ytdReturn}
              trendLabel="this year"
            />
            <MetricCard
              title="Total Investors"
              value={totalInvestors}
              icon={<Users className="w-6 h-6" />}
              trend={2}
              trendLabel="new this month"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">NAV Performance</h2>
              {/* Chart implementation will go here */}
            </Card>
            
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <ActivityItem
                  type="contribution"
                  amount={250000}
                  investor="John Smith"
                  date="2024-01-15"
                />
                <ActivityItem
                  type="withdrawal"
                  amount={100000}
                  investor="Sarah Johnson"
                  date="2024-01-10"
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend: number; 
  trendLabel: string;
}) => {
  const isPositive = trend >= 0;
  
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center space-x-2">
        {isPositive ? (
          <ArrowUp className="w-4 h-4 text-success-DEFAULT" />
        ) : (
          <ArrowDown className="w-4 h-4 text-danger-DEFAULT" />
        )}
        <span className={`text-sm font-medium ${
          isPositive ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
        }`}>
          {Math.abs(trend)}%
        </span>
        <span className="text-sm text-gray-600">{trendLabel}</span>
      </div>
    </Card>
  );
};

const ActivityItem = ({ 
  type, 
  amount, 
  investor, 
  date 
}: { 
  type: 'contribution' | 'withdrawal'; 
  amount: number; 
  investor: string; 
  date: string;
}) => {
  const isContribution = type === 'contribution';
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${
          isContribution ? 'bg-success-light' : 'bg-danger-light'
        }`}>
          {isContribution ? (
            <ArrowUp className={`w-4 h-4 text-success-DEFAULT`} />
          ) : (
            <ArrowDown className={`w-4 h-4 text-danger-DEFAULT`} />
          )}
        </div>
        <div>
          <p className="font-medium">{investor}</p>
          <p className="text-sm text-gray-600">
            {new Date(date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${
          isContribution ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
        }`}>
          {isContribution ? '+' : '-'}${(amount / 1000).toFixed(1)}k
        </p>
        <p className="text-sm text-gray-600">{type}</p>
      </div>
    </div>
  );
};

export default Index;
