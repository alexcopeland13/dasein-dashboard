import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type MonthlyNav = Tables<"monthly_nav">;
export type CapitalFlow = Tables<"capital_flows">;
export type Investor = Tables<"investors">;

/**
 * Fetch the latest NAV entry from the database
 */
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

/**
 * Fetch the NAV value as of Dec 31 of the previous year
 */
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

/**
 * Fetch all NAV data, ordered by date
 */
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

/**
 * Fetch the most recent monthly return
 */
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

/**
 * Fetch recent capital flows
 */
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

/**
 * Fetch all capital flows
 */
export async function getAllCapitalFlows(): Promise<CapitalFlow[]> {
  const { data, error } = await supabase
    .from("capital_flows")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching all capital flows:", error);
    return [];
  }

  return data || [];
}

/**
 * Count active investors
 */
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

/**
 * Add a new monthly NAV entry
 */
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

/**
 * Add a new capital flow transaction
 */
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

/**
 * Fetch all investors
 */
export async function getAllInvestors(): Promise<Investor[]> {
  const timestamp = new Date().getTime(); // Add timestamp to bust cache
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .order("name", { ascending: true })
    .headers({ 'X-Cache-Bust': `${timestamp}` });

  if (error) {
    console.error("Error fetching investors:", error);
    return [];
  }

  console.log("Fetched all investors:", data); // Add logging to debug
  return data || [];
}

/**
 * Fetch a specific investor by ID
 */
export async function getInvestorById(id: string): Promise<Investor | null> {
  const timestamp = new Date().getTime(); // Add timestamp to bust cache
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("id", id)
    .single()
    .headers({ 'X-Cache-Bust': `${timestamp}` });

  if (error) {
    console.error(`Error fetching investor ${id}:`, error);
    return null;
  }

  console.log("Fetched investor data:", data); // Add logging to debug
  return data;
}

/**
 * Fetch transactions for a specific investor
 */
export async function getInvestorTransactions(investorId: string): Promise<CapitalFlow[]> {
  const timestamp = new Date().getTime(); // Add timestamp to bust cache
  const { data, error } = await supabase
    .from("capital_flows")
    .select("*")
    .eq("investor_id", investorId)
    .order("date", { ascending: false })
    .headers({ 'X-Cache-Bust': `${timestamp}` });

  if (error) {
    console.error(`Error fetching transactions for investor ${investorId}:`, error);
    return [];
  }
  
  console.log("Fetched investor transactions:", data); // Add logging to debug
  return data || [];
}

/**
 * Create a new investor
 */
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
