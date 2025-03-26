
import React, { useState } from "react";
import { ChevronDown, ChevronUp, DollarSign, Calendar, Percent } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { CapitalFlow } from "@/services/navService";

interface InvestorRowProps {
  investor: {
    id: string;
    name: string;
    initialInvestment: number;
    currentValue: number;
    return: number;
    status: string;
    mgmtFeeRate: number;
    perfFeeRate: number;
    startDate: string;
  };
  transactions: CapitalFlow[];
  onSelectInvestor: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function InvestorRow({ investor, transactions, onSelectInvestor }: InvestorRowProps) {
  console.log(`Rendering InvestorRow for investor: ${investor.name}, startDate: ${investor.startDate}`);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-white/5" onClick={() => setExpanded(!expanded)}>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="underline cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              onSelectInvestor(investor.id);
            }}>
              {investor.name}
            </span>
          </div>
        </TableCell>
        <TableCell>{formatCurrency(investor.initialInvestment)}</TableCell>
        <TableCell>{formatCurrency(investor.currentValue)}</TableCell>
        <TableCell className={investor.return >= 0 ? "text-success-DEFAULT" : "text-danger-DEFAULT"}>
          {investor.return.toFixed(2)}%
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs ${
            investor.status === 'active' ? 'bg-success-DEFAULT/20 text-success-DEFAULT' : 'bg-danger-DEFAULT/20 text-danger-DEFAULT'
          }`}>
            {investor.status}
          </span>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            onSelectInvestor(investor.id);
          }}>View</Button>
        </TableCell>
      </TableRow>
      
      {expanded && (
        <TableRow className="bg-white/5">
          <TableCell colSpan={6} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Management Fee:</span>
                <span>{investor.mgmtFeeRate}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Performance Fee:</span>
                <span>{investor.perfFeeRate}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Start Date:</span>
                <span>{format(new Date(investor.startDate), "MMM d, yyyy")}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Transaction History</h4>
              {transactions.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-2 rounded-lg activity-item">
                      <div>
                        <span className="text-sm">{format(new Date(transaction.date), "MMM d, yyyy")}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          transaction.type === 'contribution' ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'
                        }`}>
                          {transaction.type === 'contribution' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                        <p className="text-xs text-muted-foreground">{transaction.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No transactions found</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
