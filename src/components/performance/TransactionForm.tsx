
import React from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Investor } from "@/services/dataService";
import { addCapitalFlow } from "@/services/dataService";

// Define the form schema
const formSchema = z.object({
  investorId: z.string({
    required_error: "Please select an investor",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  amount: z.coerce
    .number({
      required_error: "Please enter an amount",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be positive"),
  type: z.enum(["contribution", "withdrawal"], {
    required_error: "Please select a transaction type",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  investors: Investor[];
  onSuccess: () => void;
}

export default function TransactionForm({ investors, onSuccess }: TransactionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Find investor name
      const investor = investors.find(inv => inv.id === data.investorId);
      if (!investor) {
        toast({
          title: "Error",
          description: "Selected investor not found",
          variant: "destructive",
        });
        return;
      }

      const transaction = {
        investor_id: data.investorId,
        investor_name: investor.name,
        date: format(data.date, "yyyy-MM-dd"),
        amount: data.amount,
        type: data.type as "contribution" | "withdrawal",
      };

      const result = await addCapitalFlow(transaction);

      if (result.success) {
        toast({
          title: "Success",
          description: "Transaction recorded successfully",
        });
        form.reset();
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to record transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 metric-card mb-6">
      <h2 className="text-lg font-semibold mb-4 text-white">New Transaction</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="investorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Investor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an investor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {investors.map((investor) => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Transaction Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="contribution">Contribution</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-white">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter amount"
                    type="number"
                    {...field}
                    className="bg-gray-700 text-white"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Enter the amount without currency symbols or commas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Record Transaction
          </Button>
        </form>
      </Form>
    </Card>
  );
}
