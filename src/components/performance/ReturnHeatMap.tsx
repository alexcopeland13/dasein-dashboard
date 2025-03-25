
import React from "react";
import { Card } from "@/components/ui/card";
import { MonthlyNav } from "@/services/dataService";
import { formatNavDataForHeatMap } from "@/services/performanceService";
import { Skeleton } from "@/components/ui/skeleton";
import { getValueColorClass } from "@/utils/formatters";

interface ReturnHeatMapProps {
  navData: MonthlyNav[];
  loading: boolean;
}

const ReturnHeatMap: React.FC<ReturnHeatMapProps> = ({ navData, loading }) => {
  const heatMapData = React.useMemo(() => {
    if (!navData.length) return [];
    
    const data = formatNavDataForHeatMap(navData);
    
    // Group by year and month
    const grouped: Record<number, Record<number, number | null>> = {};
    
    data.forEach(item => {
      if (!grouped[item.year]) {
        grouped[item.year] = {};
      }
      grouped[item.year][item.month] = item.return;
    });
    
    // Get unique years and sort them
    const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);
    
    return { years, data: grouped };
  }, [navData]);

  const getColorClass = (value: number | null) => {
    if (value === null || value === undefined) return 'bg-gray-700';
    
    if (value > 5) return 'bg-green-600';
    if (value > 3) return 'bg-green-500';
    if (value > 1) return 'bg-green-400';
    if (value > 0) return 'bg-green-300';
    if (value === 0) return 'bg-gray-400';
    if (value > -2) return 'bg-red-300';
    if (value > -4) return 'bg-red-400';
    if (value > -6) return 'bg-red-500';
    return 'bg-red-600';
  };

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  if (loading) {
    return (
      <Card className="p-6 metric-card mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Monthly Returns Heat Map
        </h2>
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 metric-card mb-6">
      <h2 className="text-lg font-semibold mb-4 text-white">
        Monthly Returns Heat Map
      </h2>
      
      {heatMapData.years?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 py-1 font-medium text-white text-left">Year</th>
                {monthNames.map((month, i) => (
                  <th key={i} className="px-2 py-1 font-medium text-white text-center">
                    {month}
                  </th>
                ))}
                <th className="px-2 py-1 font-medium text-white text-center">YTD</th>
              </tr>
            </thead>
            <tbody>
              {heatMapData.years.map((year) => {
                const yearData = heatMapData.data[year];
                
                // Calculate YTD return
                let ytdReturn = null;
                let lastMonth = null;
                for (let i = 0; i <= 11; i++) {
                  if (yearData[i] !== undefined) lastMonth = i;
                }
                
                if (lastMonth !== null) {
                  let compoundReturn = 1;
                  for (let i = 0; i <= lastMonth; i++) {
                    if (yearData[i] !== null && yearData[i] !== undefined) {
                      compoundReturn *= (1 + yearData[i] / 100);
                    }
                  }
                  ytdReturn = (compoundReturn - 1) * 100;
                }
                
                return (
                  <tr key={year}>
                    <td className="px-2 py-1 font-medium text-white">{year}</td>
                    {Array.from({ length: 12 }).map((_, month) => {
                      const value = yearData[month];
                      return (
                        <td key={month} className="p-1">
                          <div className={`${getColorClass(value)} rounded p-2 text-center text-xs font-medium`}>
                            {value !== null && value !== undefined 
                              ? `${value.toFixed(1)}%` 
                              : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-1">
                      <div className={`${getColorClass(ytdReturn)} rounded p-2 text-center text-xs font-medium`}>
                        {ytdReturn !== null 
                          ? `${ytdReturn.toFixed(1)}%` 
                          : ''}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          No return data available
        </div>
      )}
    </Card>
  );
};

export default ReturnHeatMap;
