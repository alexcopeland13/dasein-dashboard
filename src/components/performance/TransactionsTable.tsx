
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Filter } from "lucide-react";
import { CapitalFlow } from "@/services/dataService";
import { exportToCSV } from "@/utils/exportUtils";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TransactionsTableProps {
  transactions: CapitalFlow[];
  loading: boolean;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof CapitalFlow>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const handleSort = (column: keyof CapitalFlow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.investor_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.date.includes(searchTerm)
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];

    // Handle special sort cases for different column types
    if (sortColumn === "amount") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleExportCSV = () => {
    const formattedData = transactions.map((transaction) => ({
      date: transaction.date,
      investor: transaction.investor_name,
      type: transaction.type,
      amount: Number(transaction.amount),
    }));
    exportToCSV(formattedData, "transactions-data");
  };

  if (loading) {
    return (
      <Card className="p-6 metric-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Transactions</h2>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 metric-card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Transactions</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter transactions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-8 bg-gray-700 text-white w-[200px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("date")}
              >
                Date
                {sortColumn === "date" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("investor_name")}
              >
                Investor
                {sortColumn === "investor_name" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("type")}
              >
                Type
                {sortColumn === "type" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer text-right"
                onClick={() => handleSort("amount")}
              >
                Amount
                {sortColumn === "amount" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.length > 0 ? (
              displayedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-white">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="text-white">
                    {transaction.investor_name}
                  </TableCell>
                  <TableCell className="text-white capitalize">
                    {transaction.type}
                  </TableCell>
                  <TableCell 
                    className={`text-right ${
                      transaction.type === "contribution" 
                        ? "text-green-500" 
                        : "text-red-500"
                    }`}
                  >
                    {transaction.type === "contribution" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-white">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber;
                
                // Handle pagination rendering for many pages
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else {
                  if (currentPage <= 3) {
                    if (i < 4) {
                      pageNumber = i + 1;
                    } else {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                  } else if (currentPage >= totalPages - 2) {
                    if (i === 0) {
                      pageNumber = 1;
                    } else if (i === 1) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      pageNumber = totalPages - (4 - i);
                    }
                  } else {
                    if (i === 0) {
                      pageNumber = 1;
                    } else if (i === 1) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else if (i === 4) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      pageNumber = currentPage + (i - 2);
                    }
                  }
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
};

export default TransactionsTable;
