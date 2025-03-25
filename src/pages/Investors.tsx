
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, ArrowUpDown } from "lucide-react";
import { InvestorRow } from "@/components/investors/InvestorRow";
import InvestorForm from "@/components/investors/InvestorForm";
import { getInvestorTransactions } from "@/services/dataService";
import { calculateInvestorValues } from "@/services/investorCalculationService";
import { useToast } from "@/hooks/use-toast";
import NavReconciliation from "@/components/dashboard/NavReconciliation";

type SortKey = 'name' | 'initialInvestment' | 'currentValue' | 'return' | 'status';
type SortDirection = 'asc' | 'desc';

const InvestorsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<{
    id: string;
    name: string;
    initialInvestment: number;
    currentValue: number;
    return: number;
    status: string;
    mgmtFeeRate: number;
    perfFeeRate: number;
    startDate: string;
    transactions?: any[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{key: SortKey; direction: SortDirection}>({
    key: 'name',
    direction: 'asc'
  });
  const [expandedInvestors, setExpandedInvestors] = useState<Record<string, boolean>>({});
  const [investorTransactions, setInvestorTransactions] = useState<Record<string, any[]>>({});
  const [isReconciled, setIsReconciled] = useState<boolean | null>(null);

  const fetchInvestors = async () => {
    setIsLoading(true);
    try {
      const investorValues = await calculateInvestorValues();
      setInvestors(investorValues);

      const transactions: Record<string, any[]> = {};
      for (const investor of investorValues) {
        const investorTransactions = await getInvestorTransactions(investor.id);
        transactions[investor.id] = investorTransactions;
      }
      setInvestorTransactions(transactions);
    } catch (err) {
      console.error("Error fetching investors:", err);
      setError("Failed to load investors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const handleSort = (key: SortKey) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedInvestors = [...investors].sort((a, b) => {
    const { key, direction } = sort;
    const factor = direction === 'asc' ? 1 : -1;
    
    if (key === 'name') {
      return a.name.localeCompare(b.name) * factor;
    } else if (key === 'status') {
      return a.status.localeCompare(b.status) * factor;
    } else {
      return ((a[key] as number) - (b[key] as number)) * factor;
    }
  });

  const filteredInvestors = sortedInvestors.filter(investor => 
    investor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectInvestor = (id: string) => {
    navigate(`/investors/${id}`);
  };

  const handleReconciliationComplete = (isReconciled: boolean) => {
    setIsReconciled(isReconciled);
    
    if (!isReconciled) {
      toast({
        title: "NAV Reconciliation Warning",
        description: "The sum of investor values doesn't match the total fund NAV. Please review the calculations.",
        variant: "destructive"
      });
    }
  };

  const SortButton = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => handleSort(sortKey)}
      className="hover:bg-white/10"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="p-8 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-semibold">Investors</h1>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investor
        </Button>
      </div>

      <InvestorForm 
        open={showAddForm} 
        onOpenChange={setShowAddForm} 
        onSuccess={fetchInvestors} 
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Investors</span>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search investors..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : filteredInvestors.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  {searchTerm ? "No investors match your search" : "No investors found"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><SortButton label="Investor Name" sortKey="name" /></TableHead>
                        <TableHead><SortButton label="Initial Investment" sortKey="initialInvestment" /></TableHead>
                        <TableHead><SortButton label="Current Value" sortKey="currentValue" /></TableHead>
                        <TableHead><SortButton label="Return %" sortKey="return" /></TableHead>
                        <TableHead><SortButton label="Status" sortKey="status" /></TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvestors.map((investor) => (
                        <InvestorRow
                          key={investor.id}
                          investor={investor}
                          transactions={investorTransactions[investor.id] || []}
                          onSelectInvestor={handleSelectInvestor}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <NavReconciliation onReconciliationComplete={handleReconciliationComplete} />
        </div>
      </div>
    </div>
  );
};

export default InvestorsPage;
