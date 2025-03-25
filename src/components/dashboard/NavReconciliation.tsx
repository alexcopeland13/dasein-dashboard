
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { verifyNavReconciliation } from "@/services/investorCalculationService";
import { formatCurrency } from "@/utils/formatters";

interface NavReconciliationProps {
  onReconciliationComplete?: (isReconciled: boolean) => void;
}

const NavReconciliation: React.FC<NavReconciliationProps> = ({
  onReconciliationComplete
}) => {
  const [data, setData] = useState<{
    totalNav: number;
    sumInvestorValues: number;
    discrepancy: number;
    isReconciled: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await verifyNavReconciliation();
        setData(result);
        
        if (onReconciliationComplete) {
          onReconciliationComplete(result.isReconciled);
        }
      } catch (error) {
        console.error("Error verifying NAV reconciliation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onReconciliationComplete]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NAV Reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NAV Reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-danger-DEFAULT flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Failed to load reconciliation data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          NAV Reconciliation
          {data.isReconciled ? (
            <CheckCircle size={18} className="text-success-DEFAULT" />
          ) : (
            <AlertTriangle size={18} className="text-danger-DEFAULT" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total NAV</p>
              <p className="text-lg font-semibold">{formatCurrency(data.totalNav)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sum of Investor Values</p>
              <p className="text-lg font-semibold">{formatCurrency(data.sumInvestorValues)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Discrepancy</p>
            <p className={`text-lg font-semibold ${data.isReconciled ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
              {formatCurrency(data.discrepancy)} 
              {data.totalNav > 0 && ` (${((data.discrepancy / data.totalNav) * 100).toFixed(4)}%)`}
            </p>
          </div>
          
          <div className={`p-3 rounded-md ${data.isReconciled ? 'bg-success-DEFAULT/10' : 'bg-danger-DEFAULT/10'}`}>
            <p className={`text-sm ${data.isReconciled ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
              {data.isReconciled 
                ? "✓ NAV is properly reconciled"
                : "⚠️ NAV is not reconciled! The sum of investor values does not match the total fund NAV."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NavReconciliation;
