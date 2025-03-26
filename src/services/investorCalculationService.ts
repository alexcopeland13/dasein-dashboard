
import { supabase } from "@/integrations/supabase/client";
import { MonthlyNav, Investor, CapitalFlow } from "@/services/dataService";

/**
 * Calculate the current value of all investors based on their transactions history
 * Updated to use start_nav values for beginning-of-month investments
 */
export async function calculateInvestorValues(): Promise<{
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
  try {
    // Get latest NAV
    const latestNav = await getLatestNav();
    if (!latestNav) return [];
    
    // Get all investors
    const investors = await getAllInvestors();
    if (!investors.length) return [];
    
    // Get all NAV data for historical tracking
    const allNavHistory = await getAllNavData();
    
    // Use the total fund NAV as a starting point to ensure reconciliation
    let totalNAV = Number(latestNav.total_nav);
    
    // Calculate all investors' values using the time-weighted approach
    const investorResults = await Promise.all(
      investors.map(async (investor) => {
        // Get investor transactions
        const transactions = await getInvestorTransactions(investor.id);
        
        // Calculate current value
        const result = calculateInvestorValue(
          investor, 
          transactions, 
          latestNav, 
          allNavHistory
        );
        
        return {
          id: investor.id,
          name: investor.name,
          initialInvestment: Number(investor.initial_investment),
          currentValue: result.currentValue,
          return: result.returnPercentage,
          status: investor.status,
          mgmtFeeRate: Number(investor.mgmt_fee_rate),
          perfFeeRate: Number(investor.performance_fee_rate),
          startDate: investor.start_date,
        };
      })
    );
    
    // Calculate the sum of all active investor values
    const activeInvestors = investorResults.filter(investor => investor.status === "active");
    const sumInvestorValues = activeInvestors.reduce((sum, investor) => sum + investor.currentValue, 0);
    
    // Scale values to ensure total NAV reconciliation
    const scaleFactor = totalNAV / sumInvestorValues;
    
    return investorResults.map(investor => {
      // Only scale active investors
      if (investor.status === "active") {
        const scaledValue = investor.currentValue * scaleFactor;
        // Recalculate return based on scaled value
        const scaledReturn = ((scaledValue - investor.initialInvestment) / investor.initialInvestment) * 100;
        
        return {
          ...investor,
          currentValue: scaledValue,
          return: scaledReturn
        };
      }
      return investor;
    });
  } catch (error) {
    console.error("Error calculating investor values:", error);
    return [];
  }
}

/**
 * Calculate a single investor's current value using time-weighted ownership approach
 * Updated to use start_nav values for more accurate calculations
 */
export function calculateInvestorValue(
  investor: Investor,
  transactions: CapitalFlow[],
  latestNav: MonthlyNav,
  allNavHistory: MonthlyNav[]
): { currentValue: number; returnPercentage: number } {
  // Special case: If investor status is "closed", return 0 value
  if (investor.status === "closed") {
    // Find the last withdrawal transaction
    const lastWithdrawal = [...transactions]
      .filter(t => t.type === "withdrawal")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (lastWithdrawal) {
      // For closed accounts, calculate return based on final withdrawal
      const totalInvested = calculateTotalInvested(Number(investor.initial_investment), transactions);
      return {
        currentValue: 0, // Account is closed, so current value is 0
        returnPercentage: calculateReturn(totalInvested, Number(lastWithdrawal.amount))
      };
    }

    return { currentValue: 0, returnPercentage: 0 };
  }

  // Sort NAV history by date (oldest first)
  const sortedNavHistory = [...allNavHistory].sort(
    (a, b) => new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
  );

  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(a.date).getTime()
  );

  // Start with initial investment
  const startDate = new Date(investor.start_date);
  let currentValue = Number(investor.initial_investment);

  console.log(`INVESTOR: ${investor.name}`);
  console.log(`  Initial Investment: ${currentValue}`);
  console.log(`  Start Date: ${investor.start_date}`);

  // Find the NAV point that contains or is immediately after the investor's start date
  let startNavIndex = 0;
  for (let i = 0; i < sortedNavHistory.length; i++) {
    if (new Date(sortedNavHistory[i].month_end_date) >= startDate) {
      startNavIndex = i;
      break;
    }
  }

  // Process each month after the investor's start date
  for (let i = startNavIndex; i < sortedNavHistory.length - 1; i++) {
    const currentMonth = sortedNavHistory[i];
    const nextMonth = sortedNavHistory[i + 1];

    // Calculate month's percentage return
    const monthReturn = (Number(nextMonth.total_nav) - Number(currentMonth.total_nav)) / Number(currentMonth.total_nav);

    // Apply return to current value
    const valueBeforeReturn = currentValue;
    currentValue = currentValue * (1 + monthReturn);

    console.log(`  Month ${currentMonth.month_end_date} to ${nextMonth.month_end_date}: Return ${(monthReturn * 100).toFixed(2)}%`);
    console.log(`    Value before: ${valueBeforeReturn.toFixed(2)}, After: ${currentValue.toFixed(2)}`);

    // Apply any transactions in this period
    const periodStart = new Date(currentMonth.month_end_date);
    const periodEnd = new Date(nextMonth.month_end_date);

    for (const transaction of sortedTransactions) {
      const transactionDate = new Date(transaction.date);

      if (transactionDate > periodStart && transactionDate <= periodEnd) {
        if (transaction.type === 'contribution') {
          currentValue += Number(transaction.amount);
          console.log(`    Added contribution: ${Number(transaction.amount)}, New value: ${currentValue.toFixed(2)}`);
        } else if (transaction.type === 'withdrawal') {
          currentValue -= Number(transaction.amount);
          console.log(`    Subtracted withdrawal: ${Number(transaction.amount)}, New value: ${currentValue.toFixed(2)}`);
        }
      }
    }
  }

  // Calculate total invested amount accounting for all contributions and withdrawals
  const totalInvested = calculateTotalInvested(Number(investor.initial_investment), sortedTransactions);

  // Calculate return percentage
  const returnPercentage = calculateReturn(totalInvested, currentValue);

  console.log(`  Final value: ${currentValue.toFixed(2)}`);
  console.log(`  Total invested: ${totalInvested.toFixed(2)}`);
  console.log(`  Return: ${returnPercentage.toFixed(2)}%`);

  return {
    currentValue,
    returnPercentage
  };
}

/**
 * Create a unified timeline of NAV points and transactions
 * Includes both month start and month end points
 */
function createUnifiedTimeline(
  navHistory: MonthlyNav[], 
  transactions: CapitalFlow[]
): { type: 'nav' | 'transaction', data: MonthlyNav | CapitalFlow, date: Date }[] {
  const timeline: { type: 'nav' | 'transaction', data: MonthlyNav | CapitalFlow, date: Date }[] = [];
  
  // Add NAV month-start points to timeline
  for (const nav of navHistory) {
    if (nav.month_start_date) {
      timeline.push({
        type: 'nav',
        data: nav,
        date: new Date(nav.month_start_date)
      });
    }
    
    // Add NAV month-end points to timeline
    timeline.push({
      type: 'nav',
      data: nav,
      date: new Date(nav.month_end_date)
    });
  }
  
  // Add transactions to timeline
  for (const transaction of transactions) {
    timeline.push({
      type: 'transaction',
      data: transaction,
      date: new Date(transaction.date)
    });
  }
  
  // Sort timeline by date
  return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate total invested amount accounting for all contributions and withdrawals
 */
function calculateTotalInvested(initialInvestment: number, transactions: CapitalFlow[]): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === 'contribution') {
      return total + Number(transaction.amount);
    } else if (transaction.type === 'withdrawal') {
      return total - Number(transaction.amount);
    }
    return total;
  }, initialInvestment);
}

/**
 * Find the closest NAV point before or equal to a given date
 */
function findClosestNavPoint(navHistory: MonthlyNav[], date: Date): MonthlyNav | null {
  // Find the latest NAV point that's before or equal to the target date
  let closestPoint = null;
  
  for (const navPoint of navHistory) {
    const navDate = new Date(navPoint.month_end_date);
    if (navDate.getTime() <= date.getTime()) {
      closestPoint = navPoint;
    } else {
      break;
    }
  }
  
  return closestPoint;
}

/**
 * Calculate return percentage
 */
function calculateReturn(invested: number, currentValue: number): number {
  if (invested <= 0) return 0;
  return ((currentValue - invested) / invested) * 100;
}

/**
 * Get the latest NAV entry
 */
async function getLatestNav(): Promise<MonthlyNav | null> {
  const { data, error } = await supabase
    .from("monthly_nav")
    .select("*")
    .order("month_end_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching latest NAV:", error);
    return null;
  }

  return data;
}

/**
 * Get all NAV entries
 */
async function getAllNavData(): Promise<MonthlyNav[]> {
  const { data, error } = await supabase
    .from("monthly_nav")
    .select("*")
    .order("month_end_date", { ascending: true });

  if (error) {
    console.error("Error fetching all NAV data:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all investors
 */
async function getAllInvestors(): Promise<Investor[]> {
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching investors:", error);
    return [];
  }

  return data || [];
}

/**
 * Get transactions for a specific investor
 */
async function getInvestorTransactions(investorId: string): Promise<CapitalFlow[]> {
  const { data, error } = await supabase
    .from("capital_flows")
    .select("*")
    .eq("investor_id", investorId)
    .order("date", { ascending: true });

  if (error) {
    console.error(`Error fetching transactions for investor ${investorId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Verify NAV reconciliation (total NAV vs sum of investor values)
 */
export async function verifyNavReconciliation(): Promise<{
  totalNav: number;
  sumInvestorValues: number;
  discrepancy: number;
  isReconciled: boolean;
}> {
  try {
    // Get latest NAV
    const latestNav = await getLatestNav();
    if (!latestNav) return { totalNav: 0, sumInvestorValues: 0, discrepancy: 0, isReconciled: false };
    
    // Calculate sum of all investor values
    const investorValues = await calculateInvestorValues();
    const sumInvestorValues = investorValues
      .filter(investor => investor.status === "active") // Only include active investors
      .reduce((sum, investor) => sum + investor.currentValue, 0);
    
    // Calculate discrepancy
    const totalNav = Number(latestNav.total_nav);
    const discrepancy = Math.abs(totalNav - sumInvestorValues);
    
    // Check if reconciled (allowing for small rounding differences)
    const isReconciled = discrepancy < (totalNav * 0.0001); // 0.01% tolerance
    
    return {
      totalNav,
      sumInvestorValues,
      discrepancy,
      isReconciled
    };
  } catch (error) {
    console.error("Error verifying NAV reconciliation:", error);
    return { totalNav: 0, sumInvestorValues: 0, discrepancy: 0, isReconciled: false };
  }
}
