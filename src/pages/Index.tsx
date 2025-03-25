
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Plus
} from "lucide-react";
import { 
  getLatestNav, 
  getYearStartNav, 
  getAllNavData, 
  getRecentActivity, 
  getActiveInvestorsCount,
  MonthlyNav,
  CapitalFlow
} from "@/services/navService";
import { Button } from "@/components/ui/button";
import NavForm from "@/components/forms/NavForm";
import { useToast } from "@/hooks/use-toast";
import MetricCard from "@/components/dashboard/MetricCard";
import NavChart from "@/components/dashboard/NavChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { formatToMillion } from "@/utils/formatters";

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

  return (
    <div className="p-8 space-y-6 animate-fade-up">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Fund performance and metrics overview</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Monthly NAV
          </Button>
        </header>

        <NavForm 
          open={showAddForm} 
          onOpenChange={setShowAddForm} 
          onSuccess={fetchData} 
        />

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
          <NavChart 
            navData={navData} 
            loading={loading.chart} 
          />
          
          <RecentActivity 
            activities={recentActivity} 
            loading={loading.activities} 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
