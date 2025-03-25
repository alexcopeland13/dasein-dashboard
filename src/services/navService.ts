
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
