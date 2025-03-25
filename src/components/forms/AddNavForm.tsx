
import { useState } from "react";
import { addMonthlyNav } from "@/services/navService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AddNavForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [nav, setNav] = useState<string>("");
  const [monthlyReturn, setMonthlyReturn] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !nav) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const navValue = parseFloat(nav);
      const returnValue = monthlyReturn ? parseFloat(monthlyReturn) : undefined;
      
      const result = await addMonthlyNav({
        month_end_date: formattedDate,
        total_nav: navValue,
        monthly_return: returnValue,
      });
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Monthly NAV data added successfully",
        });
        
        // Reset form
        setDate(new Date());
        setNav("");
        setMonthlyReturn("");
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to add monthly NAV data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 metric-card">
      <h2 className="text-lg font-semibold mb-4 text-white">Add Monthly NAV</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Month End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="nav">Total NAV ($)</Label>
          <Input
            id="nav"
            type="number"
            value={nav}
            onChange={(e) => setNav(e.target.value)}
            placeholder="1,200,000"
            step="0.01"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="monthlyReturn">Monthly Return (%)</Label>
          <Input
            id="monthlyReturn"
            type="number"
            value={monthlyReturn}
            onChange={(e) => setMonthlyReturn(e.target.value)}
            placeholder="5.0"
            step="0.01"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Add NAV Data"}
        </Button>
      </form>
    </Card>
  );
}
