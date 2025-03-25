
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import DashboardNav from "@/components/nav/DashboardNav";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown,
  Plus,
  X
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { 
  getLatestNav, 
  getYearStartNav, 
  getAllNavData, 
  getRecentActivity, 
  getActiveInvestorsCount,
  MonthlyNav,
  CapitalFlow
} from "@/services/navService";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import AddNavForm from "@/components/forms/AddNavForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatToMillion = (value: number) => {
  return `$${(value / 1000000).toFixed(2)}M`;
};

const Index = () => {
  const { toast } = useToast();
  const [currentNav, setCurrentNav] = useState<number | null>(null);
  const [monthlyReturn, setMonthlyReturn] = useState<number | null>(null);
  const [ytdReturn, setYtdReturn] = useState<number | null>(null);
  const [investorCount, setInvestorCount] = useState<number | null>(null);
  const [navData, setNavData] = useState<MonthlyNav[]>([]);
  const [recentActivity, setRecentActivity] = useState<CapitalFlow[]>([]);
  const [loading, setLoading] = useState({
    nav: true,
    ytdReturn: true,
    investors: true,
    activities: true,
    chart: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch latest NAV
      setLoading(prev => ({ ...prev, nav: true }));
      const latestNav = await getLatestNav();
      if (latestNav) {
        setCurrentNav(latestNav.total_nav);
        setMonthlyReturn(latestNav.monthly_return);
      }
      setLoading(prev => ({ ...prev, nav: false }));

      // Fetch YTD return
      setLoading(prev => ({ ...prev, ytdReturn: true }));
      const currentYear = new Date().getFullYear();
      const yearStartNav = await getYearStartNav(currentYear);
      
      if (yearStartNav && latestNav) {
        const ytdReturnValue = ((latestNav.total_nav - yearStartNav.total_nav) / yearStartNav.total_nav) * 100;
        setYtdReturn(parseFloat(ytdReturnValue.toFixed(1)));
      }
      setLoading(prev => ({ ...prev, ytdReturn: false }));

      // Fetch investor count
      setLoading(prev => ({ ...prev, investors: true }));
      const count = await getActiveInvestorsCount();
      setInvestorCount(count);
      setLoading(prev => ({ ...prev, investors: false }));

      // Fetch NAV history for chart
      setLoading(prev => ({ ...prev, chart: true }));
      const allNavData = await getAllNavData();
      setNavData(allNavData);
      setLoading(prev => ({ ...prev, chart: false }));

      // Fetch recent activity
      setLoading(prev => ({ ...prev, activities: true }));
      const activities = await getRecentActivity();
      setRecentActivity(activities);
      setLoading(prev => ({ ...prev, activities: false }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      setLoading({
        nav: false,
        ytdReturn: false,
        investors: false,
        activities: false,
        chart: false
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = navData.map(item => ({
    date: format(new Date(item.month_end_date), 'MMM yyyy'),
    value: item.total_nav
  }));

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="ml-64 p-8 animate-fade-up">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-2">Fund performance and metrics overview</p>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? "Close" : "Add Monthly NAV"}
            </Button>
          </header>

          {showAddForm && (
            <div className="mb-8">
              <AddNavForm 
                onSuccess={() => {
                  setShowAddForm(false);
                  fetchData();
                }} 
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Current NAV"
              value={loading.nav ? null : (currentNav ? formatToMillion(currentNav) : "N/A")}
              icon={<BarChart3 className="w-6 h-6" />}
              trend={monthlyReturn}
              trendLabel="vs last month"
              loading={loading.nav}
            />
            <MetricCard
              title="YTD Return"
              value={loading.ytdReturn ? null : (ytdReturn ? `${ytdReturn.toFixed(1)}%` : "N/A")}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={ytdReturn}
              trendLabel="this year"
              loading={loading.ytdReturn}
            />
            <MetricCard
              title="Total Investors"
              value={loading.investors ? null : (investorCount !== null ? investorCount : "N/A")}
              icon={<Users className="w-6 h-6" />}
              trend={2}
              trendLabel="new this month"
              loading={loading.investors}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 metric-card">
              <h2 className="text-lg font-semibold mb-4 text-white">NAV Performance</h2>
              {loading.chart ? (
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
            
            <Card className="p-6 metric-card">
              <h2 className="text-lg font-semibold mb-4 text-white">Recent Activity</h2>
              {loading.activities ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full" />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      type={activity.type as 'contribution' | 'withdrawal'}
                      amount={activity.amount}
                      investor={activity.investor_name}
                      date={activity.date}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                  No recent activities
                </div>
              )}
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
  trendLabel,
  loading = false
}: { 
  title: string; 
  value: string | number | null; 
  icon: React.ReactNode; 
  trend: number | null; 
  trendLabel: string;
  loading?: boolean;
}) => {
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
    <div className="flex items-center justify-between p-4 rounded-lg activity-item">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${
          isContribution ? 'bg-success-DEFAULT/20' : 'bg-danger-DEFAULT/20'
        }`}>
          {isContribution ? (
            <ArrowUp className={`w-4 h-4 text-success-DEFAULT`} />
          ) : (
            <ArrowDown className={`w-4 h-4 text-danger-DEFAULT`} />
          )}
        </div>
        <div>
          <p className="font-medium text-white">{investor}</p>
          <p className="text-sm text-gray-400">
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
        <p className="text-sm text-gray-400">{type}</p>
      </div>
    </div>
  );
};

export default Index;
