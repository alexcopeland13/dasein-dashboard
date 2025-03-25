
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyNav } from "@/services/dataService";
import { formatNavDataForTable } from "@/services/performanceService";
import { exportToCSV } from "@/utils/exportUtils";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceTableProps {
  navData: MonthlyNav[];
  loading: boolean;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({
  navData,
  loading,
}) => {
  const [sortColumn, setSortColumn] = useState<string>("month");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleExportCSV = () => {
    const formattedData = formatNavDataForTable(navData);
    exportToCSV(formattedData, "performance-data");
  };

  const formattedData = formatNavDataForTable(navData);
  
  // Sort data based on current sort settings
  const sortedData = [...formattedData].sort((a, b) => {
    let valueA = a[sortColumn as keyof typeof a];
    let valueB = b[sortColumn as keyof typeof b];
    
    // Parse percentage values for proper numeric sorting
    if (typeof valueA === 'string' && valueA.endsWith('%')) {
      valueA = parseFloat(valueA);
    }
    if (typeof valueB === 'string' && valueB.endsWith('%')) {
      valueB = parseFloat(valueB);
    }
    
    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <Card className="p-6 metric-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">
            Historical Performance
          </h2>
          <Skeleton className="h-9 w-[120px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 metric-card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          Historical Performance
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportCSV}
          disabled={navData.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("month")}
              >
                Month
                {sortColumn === "month" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("navValue")}
              >
                NAV Value
                {sortColumn === "navValue" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("monthlyReturn")}
              >
                Monthly Return
                {sortColumn === "monthlyReturn" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
              <TableHead
                className="text-white cursor-pointer"
                onClick={() => handleSort("ytdReturn")}
              >
                YTD Return
                {sortColumn === "ytdReturn" && (
                  <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-white">{item.month}</TableCell>
                  <TableCell className="text-white">{item.navValue}</TableCell>
                  <TableCell 
                    className={
                      item.monthlyReturn !== 'N/A' && !item.monthlyReturn.startsWith('-')
                        ? 'text-green-500'
                        : item.monthlyReturn === 'N/A'
                        ? 'text-white'
                        : 'text-red-500'
                    }
                  >
                    {item.monthlyReturn}
                  </TableCell>
                  <TableCell 
                    className={
                      item.ytdReturn.startsWith('-')
                        ? 'text-red-500'
                        : 'text-green-500'
                    }
                  >
                    {item.ytdReturn}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-white">
                  No performance data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default PerformanceTable;
