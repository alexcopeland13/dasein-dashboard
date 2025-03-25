
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PerformanceMetrics from "@/components/performance/PerformanceMetrics";
import PerformanceTable from "@/components/performance/PerformanceTable";
import PerformanceChart from "@/components/performance/PerformanceChart";
import ReturnHeatMap from "@/components/performance/ReturnHeatMap";
import TransactionsTable from "@/components/performance/TransactionsTable";
import TransactionForm from "@/components/performance/TransactionForm";
import { 
  getAllNavData, 
  getAllCapitalFlows,
  getAllInvestors
} from "@/services/dataService";
import { 
  calculateAnnualizedReturn, 
  calculateVolatility, 
  calculateSharpeRatio,
  findBestMonth,
  findWorstMonth,
  calculateMaxDrawdown
} from "@/services/performanceService";
import { MonthlyNav, CapitalFlow, Investor } from "@/services/dataService";

const Performance = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [navData, setNavData] = useState<MonthlyNav[]>([]);
  const [transactions, setTransactions] = useState<CapitalFlow[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate performance metrics
  const annualizedReturn = React.useMemo(() => {
    if (!navData.length) return null;
    
    // Extract monthly returns
    const monthlyReturns = navData
      .filter(nav => nav.monthly_return !== null)
      .map(nav => nav.monthly_return!);
    
    // Calculate years covered
    const sortedData = [...navData].sort(
      (a, b) => new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
    );
    
    if (sortedData.length < 2) return null;
    
    const startDate = new Date(sortedData[0].month_end_date);
    const endDate = new Date(sortedData[sortedData.length - 1].month_end_date);
    const yearsCount = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    return calculateAnnualizedReturn(monthlyReturns, yearsCount);
  }, [navData]);

  const volatility = React.useMemo(() => {
    if (!navData.length) return null;
    
    // Extract monthly returns
    const monthlyReturns = navData
      .filter(nav => nav.monthly_return !== null)
      .map(nav => nav.monthly_return!);
    
    return calculateVolatility(monthlyReturns);
  }, [navData]);

  const sharpeRatio = React.useMemo(() => {
    return calculateSharpeRatio(annualizedReturn, volatility);
  }, [annualizedReturn, volatility]);

  const bestMonth = React.useMemo(() => {
    return findBestMonth(navData);
  }, [navData]);

  const worstMonth = React.useMemo(() => {
    return findWorstMonth(navData);
  }, [navData]);

  const maxDrawdown = React.useMemo(() => {
    return calculateMaxDrawdown(navData);
  }, [navData]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [navDataResult, transactionsResult, investorsResult] = await Promise.all([
        getAllNavData(),
        getAllCapitalFlows(),
        getAllInvestors()
      ]);

      setNavData(navDataResult);
      setTransactions(transactionsResult);
      setInvestors(investorsResult);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container py-8 animate-fade-up">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-white">Performance</h1>
        <p className="text-gray-400">
          Analyze fund performance metrics and historical returns
        </p>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <PerformanceMetrics 
            annualizedReturn={annualizedReturn}
            volatility={volatility}
            sharpeRatio={sharpeRatio}
            bestMonth={bestMonth}
            worstMonth={worstMonth}
            maxDrawdown={maxDrawdown}
            loading={loading}
          />
          
          <div className="mb-8">
            <PerformanceChart 
              navData={navData}
              loading={loading}
            />
          </div>
          
          <PerformanceTable 
            navData={navData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="returns" className="space-y-8">
          <PerformanceMetrics 
            annualizedReturn={annualizedReturn}
            volatility={volatility}
            sharpeRatio={sharpeRatio}
            bestMonth={bestMonth}
            worstMonth={worstMonth}
            maxDrawdown={maxDrawdown}
            loading={loading}
          />
          
          <div className="mb-8">
            <ReturnHeatMap 
              navData={navData}
              loading={loading}
            />
          </div>
          
          <PerformanceTable 
            navData={navData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionsTable 
                transactions={transactions}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-1">
              <TransactionForm 
                investors={investors}
                onSuccess={fetchData}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Performance;
