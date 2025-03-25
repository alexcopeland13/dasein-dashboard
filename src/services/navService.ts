
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type MonthlyNav = Tables<"monthly_nav">;
export type CapitalFlow = Tables<"capital_flows">;
export type Investor = Tables<"investors">;

export async function getLatestNav(): Promise<MonthlyNav | null> {
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

export async function getYearStartNav(year: number): Promise<MonthlyNav | null> {
  // Get the NAV value as of Dec 31 of the previous year
  const prevYearDec31 = `${year-1}-12-31`;
  
  const { data, error } = await supabase
    .from("monthly_nav")
    .select("*")
    .lte("month_end_date", prevYearDec31)
    .order("month_end_date", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error("Error fetching year start NAV:", error);
    return null;
  }

  return data;
}

export async function getAllNavData(): Promise<MonthlyNav[]> {
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

export async function getPreviousMonthReturn(): Promise<number | null> {
  const { data, error } = await supabase
    .from("monthly_nav")
    .select("monthly_return")
    .order("month_end_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching previous month return:", error);
    return null;
  }

  return data.monthly_return;
}

export async function getRecentActivity(limit: number = 5): Promise<CapitalFlow[]> {
  const { data, error } = await supabase
    .from("capital_flows")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }

  return data || [];
}

export async function getActiveInvestorsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("investors")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    console.error("Error fetching active investors count:", error);
    return 0;
  }

  return count || 0;
}

export async function addMonthlyNav(data: { 
  month_end_date: string; 
  total_nav: number; 
  monthly_return?: number;
  aum_change?: number;
  management_fees?: number;
}): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase
    .from("monthly_nav")
    .insert(data);

  if (error) {
    console.error("Error adding monthly NAV:", error);
    return { success: false, error };
  }

  return { success: true };
}

export async function getAllInvestors(): Promise<Investor[]> {
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

export async function getInvestorById(id: string): Promise<Investor | null> {
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching investor ${id}:`, error);
    return null;
  }

  return data;
}

export async function getInvestorTransactions(investorId: string): Promise<CapitalFlow[]> {
  const { data, error } = await supabase
    .from("capital_flows")
    .select("*")
    .eq("investor_id", investorId)
    .order("date", { ascending: false });

  if (error) {
    console.error(`Error fetching transactions for investor ${investorId}:`, error);
    return [];
  }

  return data || [];
}

// Calculate investor value based on ownership percentage
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
    
    // Calculate total initial investment
    const totalInitialInvestment = investors.reduce(
      (sum, investor) => sum + Number(investor.initial_investment),
      0
    );
    
    // For each investor, calculate their current value based on ownership percentage
    return await Promise.all(
      investors.map(async (investor) => {
        // Get investor transactions
        const transactions = await getInvestorTransactions(investor.id);
        
        // Calculate total contribution excluding initial investment
        const additionalContributions = transactions
          .filter(t => t.type === 'contribution')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Calculate total withdrawals
        const totalWithdrawals = transactions
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Calculate ownership percentage based on initial investment
        const ownershipPercentage = Number(investor.initial_investment) / totalInitialInvestment;
        
        // Calculate current value based on ownership percentage of latest NAV
        const currentValue = Number(latestNav.total_nav) * ownershipPercentage;
        
        // Calculate return percentage
        const totalInvested = Number(investor.initial_investment) + additionalContributions - totalWithdrawals;
        const returnPercentage = ((currentValue - totalInvested) / totalInvested) * 100;
        
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
      })
    );
  } catch (error) {
    console.error("Error calculating investor values:", error);
    return [];
  }
}

export async function createInvestor(data: {
  name: string;
  initial_investment: number;
  mgmt_fee_rate: number;
  performance_fee_rate: number;
  start_date: string;
  status: string;
}): Promise<{ success: boolean; error?: any; id?: string }> {
  const { data: newInvestor, error } = await supabase
    .from("investors")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error creating investor:", error);
    return { success: false, error };
  }

  return { success: true, id: newInvestor.id };
}

export async function addCapitalFlow(data: {
  investor_id: string;
  investor_name: string;
  date: string;
  amount: number;
  type: 'contribution' | 'withdrawal';
}): Promise<{ success: boolean; error?: any }> {
  const { error } = await supabase
    .from("capital_flows")
    .insert(data);

  if (error) {
    console.error("Error adding capital flow:", error);
    return { success: false, error };
  }

  return { success: true };
}
