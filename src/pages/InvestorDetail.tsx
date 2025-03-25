
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Plus
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  getInvestorById, 
  getInvestorTransactions, 
  getLatestNav
} from "@/services/navService";
import CapitalFlowForm from "@/components/investors/CapitalFlowForm";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const InvestorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investor, setInvestor] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [returnPercentage, setReturnPercentage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const fetchInvestorData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch investor details
      const investorData = await getInvestorById(id);
      if (!investorData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Investor not found",
        });
        navigate("/investors");
        return;
      }
      setInvestor(investorData);
      
      // Fetch transactions
      const transactionData = await getInvestorTransactions(id);
      setTransactions(transactionData);
      
      // Calculate current value based on ownership percentage
      const latestNav = await getLatestNav();
      if (latestNav) {
        // This is a simplified calculation - in a real system, you'd need a more sophisticated
        // way to track ownership percentage that accounts for all contributions and withdrawals
        const initialInvestment = Number(investorData.initial_investment);
        
        // Calculate total contributions and withdrawals
        const totalContributions = transactionData
          .filter(t => t.type === 'contribution')
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const totalWithdrawals = transactionData
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Calculate total invested
        const totalInvested = initialInvestment + totalContributions - totalWithdrawals;
        
        // This is a simplification - assuming ownership proportion based on initial investment
        // In a real system, you'd need to track the exact ownership percentage over time
        const estimatedCurrentValue = latestNav.total_nav * (initialInvestment / 20000000); // Assuming $20M initial fund size
        
        setCurrentValue(estimatedCurrentValue);
        
        // Calculate return percentage
        const returnPct = ((estimatedCurrentValue - totalInvested) / totalInvested) * 100;
        setReturnPercentage(returnPct);
      }
    } catch (error) {
      console.error("Error fetching investor data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load investor data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestorData();
  }, [id]);

  // Sort transactions by date (newest first) and generate chart data
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Generate chart data (this is simplified - in a real app you'd need to calculate balance over time)
  const chartData = transactions.length > 0 
    ? transactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .reduce((acc: any[], transaction, index) => {
          const prevBalance = index > 0 ? acc[index - 1].balance : Number(investor?.initial_investment || 0);
          const change = transaction.type === 'contribution' 
            ? Number(transaction.amount) 
            : -Number(transaction.amount);
          
          return [...acc, {
            date: format(new Date(transaction.date), 'MMM yyyy'),
            balance: prevBalance + change
          }];
        }, [])
    : [];

  // Add current balance point to chart
  if (chartData.length > 0 && currentValue) {
    chartData.push({
      date: 'Current',
      balance: currentValue
    });
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => navigate("/investors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investors
        </Button>
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="p-8">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => navigate("/investors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investors
        </Button>
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">Investor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-up">
      <Button variant="outline" size="sm" className="mb-6" onClick={() => navigate("/investors")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Investors
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mr-3">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{investor.name}</h1>
            <p className="text-muted-foreground">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                investor.status === 'active' 
                  ? 'bg-success-DEFAULT/20 text-success-DEFAULT' 
                  : 'bg-danger-DEFAULT/20 text-danger-DEFAULT'
              }`}>
                {investor.status}
              </span>
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowAddTransaction(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
        
        <CapitalFlowForm
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          onSuccess={fetchInvestorData}
          investorId={investor.id}
          investorName={investor.name}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Initial Investment"
          value={formatCurrency(Number(investor.initial_investment))}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          title="Current Value"
          value={currentValue ? formatCurrency(currentValue) : "Calculating..."}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Return"
          value={returnPercentage ? `${returnPercentage.toFixed(2)}%` : "Calculating..."}
          icon={returnPercentage && returnPercentage >= 0 
            ? <ArrowUp className="h-5 w-5 text-success-DEFAULT" /> 
            : <ArrowDown className="h-5 w-5 text-danger-DEFAULT" />}
          valueColor={returnPercentage && returnPercentage >= 0 ? "text-success-DEFAULT" : "text-danger-DEFAULT"}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Investment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              <div className="flex justify-between mb-4">
                <div>
                  <p>Management Fee: {investor.mgmt_fee_rate}%</p>
                  <p>Performance Fee: {investor.performance_fee_rate}%</p>
                </div>
                <div>
                  <p>Start Date: {format(new Date(investor.start_date), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Balance"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(39, 20, 69, 0.9)',
                        borderColor: 'rgba(151, 222, 244, 0.2)',
                        color: 'white'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="rgb(151, 222, 244)"
                      strokeWidth={2}
                      dot={{ fill: 'rgb(151, 222, 244)', strokeWidth: 1, r: 4 }}
                      activeDot={{ r: 6, fill: 'rgb(178, 247, 245)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {sortedTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'contribution' 
                          ? 'bg-success-DEFAULT/20' 
                          : 'bg-danger-DEFAULT/20'
                      }`}>
                        {transaction.type === 'contribution' ? (
                          <ArrowUp className="h-4 w-4 text-success-DEFAULT" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-danger-DEFAULT" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.type === 'contribution' ? 'Contribution' : 'Withdrawal'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'contribution' 
                          ? 'text-success-DEFAULT' 
                          : 'text-danger-DEFAULT'
                      }`}>
                        {transaction.type === 'contribution' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No transactions found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ 
  title, 
  value, 
  icon,
  valueColor 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  valueColor?: string;
}) => {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor || 'text-white'}`}>{value}</p>
    </Card>
  );
};

export default InvestorDetail;
