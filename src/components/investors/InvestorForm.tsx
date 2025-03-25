
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { createInvestor } from "@/services/navService";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  initial_investment: z.coerce
    .number({
      required_error: "Initial investment is required",
      invalid_type_error: "Initial investment must be a number",
    })
    .positive("Initial investment must be a positive number"),
  mgmt_fee_rate: z.coerce
    .number({
      required_error: "Management fee rate is required",
      invalid_type_error: "Management fee rate must be a number",
    })
    .min(0, "Fee rate cannot be negative")
    .max(10, "Fee rate is too high"),
  performance_fee_rate: z.coerce
    .number({
      required_error: "Performance fee rate is required",
      invalid_type_error: "Performance fee rate must be a number",
    })
    .min(0, "Fee rate cannot be negative")
    .max(50, "Fee rate is too high"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Status is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface InvestorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InvestorForm({ open, onOpenChange, onSuccess }: InvestorFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initial_investment: undefined,
      mgmt_fee_rate: 2, // Default management fee
      performance_fee_rate: 20, // Default performance fee
      status: "active",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      const result = await createInvestor({
        name: data.name,
        initial_investment: data.initial_investment,
        mgmt_fee_rate: data.mgmt_fee_rate,
        performance_fee_rate: data.performance_fee_rate,
        start_date: formatDate(data.start_date),
        status: data.status,
      });

      if (result.success) {
        toast({
          title: "Investor Added Successfully",
          description: `Added ${data.name} to investors`,
        });
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add investor",
          description: result.error?.message || "An unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error submitting investor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add investor. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Investor</DialogTitle>
          <DialogDescription>
            Enter the investor details to create a new investor account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter investor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initial_investment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Investment ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter initial investment amount"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value === "" ? undefined : e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mgmt_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Management Fee (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value === "" ? undefined : e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performance_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Fee (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="20"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value === "" ? undefined : e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                      placeholder="Select start date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Investor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
