
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";
import { getInvestorById, getInvestorTransactions, getLatestNav, getAllNavData } from "@/services/dataService";
import { calculateInvestorValue } from "@/services/investorCalculationService";
import { Investor, CapitalFlow, MonthlyNav } from "@/services/dataService";

const InvestorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [transactions, setTransactions] = useState<CapitalFlow[]>([]);
  const [latestNav, setLatestNav] = useState<MonthlyNav | null>(null);
  const [allNavHistory, setAllNavHistory] = useState<MonthlyNav[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!id) return;
        
        // Fetch investor data
        const investorData = await getInvestorById(id);
        setInvestor(investorData);
        
        // Fetch transactions
        const transactionData = await getInvestorTransactions(id);
        setTransactions(transactionData);
        
        // Fetch latest NAV
        const navData = await getLatestNav();
        setLatestNav(navData);
        
        // Fetch all NAV history
        const navHistory = await getAllNavData();
        setAllNavHistory(navHistory);
      } catch (error) {
        console.error("Error fetching investor data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const calculateResult = (investorData: Investor, transactionData: CapitalFlow[]) => {
    if (!investorData || !latestNav || !allNavHistory) {
      return { currentValue: 0, returnPercentage: 0 };
    }
    
    const result = calculateInvestorValue(
      investorData,
      transactionData,
      latestNav,
      allNavHistory
    );
    
    return result;
  };
  
  const handleTransactionAdded = async () => {
    if (!id) return;
    
    // Refresh transactions
    const transactionData = await getInvestorTransactions(id);
    setTransactions(transactionData);
    
    // Close dialog
    setShowAddTransaction(false);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/investors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (!investor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/investors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Investor Not Found</h1>
        </div>
        <p>The investor you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link to="/investors">Back to Investors</Link>
        </Button>
      </div>
    );
  }
  
  const { currentValue, returnPercentage } = calculateResult(investor, transactions);
  
  // Calculate total contributions and withdrawals
  const totalContributions = transactions
    .filter(t => t.type === 'contribution')
    .reduce((sum, t) => sum + Number(t.amount), Number(investor.initial_investment));
    
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/investors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{investor.name}</h1>
          <span className={`px-2 py-1 rounded text-xs ${
            investor.status === 'active' ? 'bg-success-DEFAULT/20 text-success-DEFAULT' : 'bg-muted text-muted-foreground'
          }`}>
            {investor.status.charAt(0).toUpperCase() + investor.status.slice(1)}
          </span>
        </div>
        
        <Button onClick={() => setShowAddTransaction(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Started {formatDate(investor.start_date)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnPercentage >= 0 ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
              {formatPercentage(returnPercentage / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Initial Investment: {formatCurrency(Number(investor.initial_investment))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(Number(investor.mgmt_fee_rate) / 100)} / {formatPercentage(Number(investor.performance_fee_rate) / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Management / Performance
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial Investment</span>
                    <span className="font-medium">{formatCurrency(Number(investor.initial_investment))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Contributions</span>
                    <span className="font-medium">{formatCurrency(totalContributions - Number(investor.initial_investment))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Withdrawals</span>
                    <span className="font-medium">{formatCurrency(totalWithdrawals)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Invested</span>
                    <span className="font-medium">{formatCurrency(totalContributions - totalWithdrawals)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Current Value</span>
                    <span className="font-medium">{formatCurrency(currentValue)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Return</span>
                    <span className={`font-medium ${returnPercentage >= 0 ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
                      {formatPercentage(returnPercentage / 100)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                        </div>
                        <span className={`font-medium ${
                          transaction.type === 'contribution' ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
                        }`}>
                          {transaction.type === 'contribution' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                        </span>
                      </div>
                    ))}
                    
                    {transactions.length > 5 && (
                      <Button variant="ghost" className="w-full" onClick={() => setActiveTab("transactions")}>
                        View All Transactions
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Transactions will appear here once the component is implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Performance chart will appear here once the component is implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorDetail;
