import { supabase } from "@/integrations/supabase/client";
import { MonthlyNav, Investor, CapitalFlow } from "@/services/dataService";

/**
 * Calculate the current value of all investors based on their transactions history
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
    
    // Process each investor
    return await Promise.all(
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
  } catch (error) {
    console.error("Error calculating investor values:", error);
    return [];
  }
}

/**
 * Calculate a single investor's current value
 */
export function calculateInvestorValue(
  investor: Investor,
  transactions: CapitalFlow[],
  latestNav: MonthlyNav,
  allNavHistory: MonthlyNav[]
): { currentValue: number; returnPercentage: number } {
  // Sort transactions by date (oldest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Initialize with initial investment
  let investorValue = Number(investor.initial_investment);
  let totalInvested = Number(investor.initial_investment);
  let ownershipPercentage = 0;
  
  // Get the initial NAV value at investor start
  const investorStartDate = new Date(investor.start_date);
  const initialNavPoint = findClosestNavPoint(allNavHistory, investorStartDate);
  
  if (initialNavPoint) {
    // Set initial ownership percentage based on initial investment
    ownershipPercentage = Number(investor.initial_investment) / Number(initialNavPoint.total_nav);
  }
  
  // Special case: If investor status is "closed", return their final withdrawal value
  if (investor.status === "closed") {
    // Find the last withdrawal transaction
    const lastWithdrawal = [...sortedTransactions]
      .filter(t => t.type === "withdrawal")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
    if (lastWithdrawal) {
      return {
        currentValue: 0, // Account is closed, so current value is 0
        returnPercentage: calculateReturn(totalInvested, Number(lastWithdrawal.amount))
      };
    }
  }
  
  // Process each transaction and adjust ownership percentage
  for (const transaction of sortedTransactions) {
    const transactionDate = new Date(transaction.date);
    const navPointBeforeTransaction = findClosestNavPoint(allNavHistory, transactionDate);
    
    if (!navPointBeforeTransaction) continue;
    
    const fundValueAtTransaction = Number(navPointBeforeTransaction.total_nav);
    
    if (transaction.type === "contribution") {
      // Calculate additional ownership percentage from new contribution
      const additionalOwnership = Number(transaction.amount) / fundValueAtTransaction;
      ownershipPercentage += additionalOwnership;
      totalInvested += Number(transaction.amount);
    } else if (transaction.type === "withdrawal") {
      // Calculate reduced ownership percentage from withdrawal
      const withdrawalPercentage = Number(transaction.amount) / (fundValueAtTransaction * ownershipPercentage);
      ownershipPercentage -= ownershipPercentage * withdrawalPercentage;
      totalInvested -= Number(transaction.amount);
    }
  }
  
  // Calculate current value based on final ownership percentage and latest NAV
  const currentValue = investor.status === "closed" 
    ? 0 
    : Number(latestNav.total_nav) * ownershipPercentage;
  
  // Calculate return percentage
  const returnPercentage = calculateReturn(totalInvested, currentValue);
  
  return {
    currentValue,
    returnPercentage
  };
}

/**
 * Find the closest NAV point before a given date
 */
function findClosestNavPoint(navHistory: MonthlyNav[], date: Date): MonthlyNav | null {
  // Sort NAV history by date (oldest first)
  const sortedNavHistory = [...navHistory].sort(
    (a, b) => new Date(a.month_end_date).getTime() - new Date(b.month_end_date).getTime()
  );
  
  // Find the latest NAV point that's before or equal to the target date
  let closestPoint = null;
  
  for (const navPoint of sortedNavHistory) {
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
    const sumInvestorValues = investorValues.reduce((sum, investor) => sum + investor.currentValue, 0);
    
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
