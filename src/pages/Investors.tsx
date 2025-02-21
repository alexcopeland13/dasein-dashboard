
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

type Investor = {
  id: string;
  name: string;
};

const InvestorsPage = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const { data, error } = await supabase
          .from("investors")
          .select("id, name")
          .order("name");

        if (error) throw error;

        setInvestors(data || []);
      } catch (err) {
        console.error("Error fetching investors:", err);
        setError("Failed to load investors");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  return (
    <div className="p-8 space-y-6 animate-fade-up">
      <div className="flex items-center space-x-2">
        <Users className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-semibold">Investors</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Investors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading investors...</div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : investors.length === 0 ? (
            <div className="text-muted-foreground">No investors found</div>
          ) : (
            <ul className="space-y-2">
              {investors.map((investor) => (
                <li
                  key={investor.id}
                  className="p-3 rounded-lg activity-item hover:bg-white/5 transition-colors"
                >
                  {investor.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestorsPage;
