
import { format } from "date-fns";
import { MonthlyNav } from "./dataService";
import { formatCurrency, formatToMillion } from "@/utils/formatters";

/**
 * Calculate YTD return based on year-start NAV and latest NAV
 */
export function calculateYTDReturn(
  yearStartNav: MonthlyNav | null, 
  latestNav: MonthlyNav | null
): number | null {
  if (!yearStartNav || !latestNav) return null;
  
  const startValue = yearStartNav.total_nav;
  const currentValue = latestNav.total_nav;
  
  return ((currentValue - startValue) / startValue) * 100;
}

/**
 * Calculate annualized return from a series of monthly returns
 * @param monthlyReturns Array of monthly return percentages
 * @param yearsCount Number of years (can be fractional)
 */
export function calculateAnnualizedReturn(
  monthlyReturns: number[],
  yearsCount: number
): number | null {
  if (!monthlyReturns.length || yearsCount <= 0) return null;
  
  // Convert percentages to decimal factors (e.g., 5% → 1.05)
  const returnFactors = monthlyReturns.map(r => 1 + (r / 100));
  
  // Calculate the cumulative return factor by multiplying all monthly factors
  const cumulativeReturn = returnFactors.reduce((acc, factor) => acc * factor, 1);
  
  // Calculate annualized return
  const annualizedReturn = Math.pow(cumulativeReturn, 1 / yearsCount) - 1;
  
  // Convert back to percentage
  return annualizedReturn * 100;
}

/**
 * Calculate volatility (standard deviation) of returns
 * @param returns Array of return percentages
 */
export function calculateVolatility(returns: number[]): number | null {
  if (!returns.length) return null;
  
  // Calculate mean
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate sum of squared differences
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const sumSquaredDiffs = squaredDiffs.reduce((sum, diff) => sum + diff, 0);
  
  // Calculate standard deviation
  const volatility = Math.sqrt(sumSquaredDiffs / returns.length);
  
  return volatility;
}

/**
 * Calculate Sharpe ratio
 * @param annualizedReturn Annualized return percentage
 * @param volatility Standard deviation of returns
 * @param riskFreeRate Risk-free rate (default: 2%)
 */
export function calculateSharpeRatio(
  annualizedReturn: number | null, 
  volatility: number | null, 
  riskFreeRate: number = 2
): number | null {
  if (annualizedReturn === null || volatility === null || volatility === 0) return null;
  
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Find the best performing month
 * @param navData Array of monthly NAV data
 */
export function findBestMonth(navData: MonthlyNav[]): { month: string; return: number } | null {
  if (!navData.length) return null;
  
  const filtered = navData.filter(nav => nav.monthly_return !== null);
  if (!filtered.length) return null;
  
  const bestMonth = filtered.reduce((best, current) => {
    if (current.monthly_return! > best.monthly_return!) return current;
    return best;
  }, filtered[0]);
  
  return {
    month: format(new Date(bestMonth.month_end_date), 'MMM yyyy'),
    return: bestMonth.monthly_return!
  };
}

/**
 * Find the worst performing month
 * @param navData Array of monthly NAV data
 */
export function findWorstMonth(navData: MonthlyNav[]): { month: string; return: number } | null {
  if (!navData.length) return null;
  
  const filtered = navData.filter(nav => nav.monthly_return !== null);
  if (!filtered.length) return null;
  
  const worstMonth = filtered.reduce((worst, current) => {
    if (current.monthly_return! < worst.monthly_return!) return current;
    return worst;
  }, filtered[0]);
  
  return {
    month: format(new Date(worstMonth.month_end_date), 'MMM yyyy'),
    return: worstMonth.monthly_return!
  };
}

/**
 * Calculate maximum drawdown from a series of NAV values
 * @param navData Array of monthly NAV data, sorted by date ascending
 */
export function calculateMaxDrawdown(navData: MonthlyNav[]): { 
  percentage: number; 
  startDate: string; 
  endDate: string;
} | null {
  if (navData.length < 2) return null;
  
  let maxDrawdown = 0;
  let maxNavValue = navData[0].total_nav;
  let drawdownStartDate = navData[0].month_end_date;
  let drawdownEndDate = navData[0].month_end_date;
  let currentDrawdownStart = navData[0].month_end_date;
  
  for (let i = 1; i < navData.length; i++) {
    const currentNav = navData[i].total_nav;
    
    // Update max NAV if we have a new high
    if (currentNav > maxNavValue) {
      maxNavValue = currentNav;
      currentDrawdownStart = navData[i].month_end_date;
    } 
    // Calculate current drawdown
    else {
      const currentDrawdown = (maxNavValue - currentNav) / maxNavValue;
      
      // Update max drawdown if current drawdown is larger
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        drawdownStartDate = currentDrawdownStart;
        drawdownEndDate = navData[i].month_end_date;
      }
    }
  }
  
  return {
    percentage: maxDrawdown * 100,
    startDate: drawdownStartDate,
    endDate: drawdownEndDate
  };
}

/**
 * Format NAV data for table display
 */
export function formatNavDataForTable(navData: MonthlyNav[]): {
  month: string;
  navValue: string;
  monthlyReturn: string;
  ytdReturn: string;
}[] {
  if (!navData.length) return [];
  
  // Sort by date ascending
  const sortedData = [...navData].sort((a, b) => 
    new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
  );
  
  // Group by year
  const dataByYear: Record<number, MonthlyNav[]> = {};
  sortedData.forEach(nav => {
    const year = new Date(nav.month_end_date).getFullYear();
    if (!dataByYear[year]) dataByYear[year] = [];
    dataByYear[year].push(nav);
  });
  
  // Calculate YTD returns for each year and format data
  return sortedData.map(nav => {
    const navDate = new Date(nav.month_end_date);
    const year = navDate.getFullYear();
    const yearData = dataByYear[year];
    const yearStart = yearData[0];
    
    // Calculate YTD return
    const ytdReturn = yearStart 
      ? ((nav.total_nav - yearStart.total_nav) / yearStart.total_nav) * 100 
      : 0;
    
    return {
      month: format(navDate, 'MMM yyyy'),
      navValue: formatCurrency(nav.total_nav),
      monthlyReturn: nav.monthly_return !== null 
        ? `${nav.monthly_return.toFixed(2)}%` 
        : 'N/A',
      ytdReturn: `${ytdReturn.toFixed(2)}%`
    };
  });
}

/**
 * Format NAV data for heat map visualization
 */
export function formatNavDataForHeatMap(navData: MonthlyNav[]): {
  year: number;
  month: number;
  return: number | null;
}[] {
  if (!navData.length) return [];
  
  return navData.map(nav => {
    const date = new Date(nav.month_end_date);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      return: nav.monthly_return
    };
  });
}

/**
 * Calculate investor values based on ownership percentage
 */
export async function calculateInvestorValues(
  investors: any[],
  latestNav: MonthlyNav | null
): Promise<{
  id: string;
  name: string;
  initialInvestment: number;
  currentValue: number;
  return: number;
  status: string;
  mgmtFeeRate: number;
  perfFeeRate: number;
  startDate: string;
}[]> {
  if (!investors.length || !latestNav) return [];
  
  // Calculate total initial investment
  const totalInitialInvestment = investors.reduce(
    (sum, investor) => sum + Number(investor.initial_investment),
    0
  );
  
  // Calculate each investor's values
  return investors.map(investor => {
    // Calculate ownership percentage based on initial investment
    const ownershipPercentage = Number(investor.initial_investment) / totalInitialInvestment;
    
    // Calculate current value based on ownership percentage of latest NAV
    const currentValue = Number(latestNav.total_nav) * ownershipPercentage;
    
    // Calculate return percentage
    const returnPercentage = ((currentValue - Number(investor.initial_investment)) / Number(investor.initial_investment)) * 100;
    
    return {
      id: investor.id,
      name: investor.name,
      initialInvestment: Number(investor.initial_investment),
      currentValue,
      return: returnPercentage,
      status: investor.status,
      mgmtFeeRate: Number(investor.mgmt_fee_rate),
      perfFeeRate: Number(investor.performance_fee_rate),
      startDate: investor.start_date,
    };
  });
}

/**
 * Prepare NAV data for chart display
 */
export function prepareChartData(navData: MonthlyNav[], benchmark?: any[]) {
  if (!navData.length) return [];

  // Sort by date
  const sortedData = [...navData].sort(
    (a, b) => new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
  );

  return sortedData.map((nav) => {
    const date = new Date(nav.month_end_date);
    return {
      date: format(date, "MMM yyyy"),
      nav: Number(nav.total_nav),
      // Add benchmark data if available
      benchmark: benchmark 
        ? benchmark.find(b => 
            format(new Date(b.date), "MMM yyyy") === format(date, "MMM yyyy")
          )?.value 
        : undefined,
    };
  });
}
