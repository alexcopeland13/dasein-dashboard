
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { addMonthlyNav } from "@/services/navService";
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

const formSchema = z.object({
  month_end_date: z.date({
    required_error: "Month end date is required",
  }),
  total_nav: z.coerce
    .number({
      required_error: "NAV value is required",
      invalid_type_error: "NAV must be a number",
    })
    .positive("NAV must be a positive number"),
  monthly_return: z.coerce
    .number({
      invalid_type_error: "Return must be a number",
    })
    .optional(),
  management_fees: z.coerce
    .number({
      invalid_type_error: "Fees must be a number",
    })
    .optional(),
  aum_change: z.coerce
    .number({
      invalid_type_error: "AUM change must be a number",
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NavFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NavForm({ open, onOpenChange, onSuccess }: NavFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total_nav: undefined,
      monthly_return: undefined,
      management_fees: undefined,
      aum_change: undefined,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const formatDate = (date: Date) => {
        return date.toISOString().split("T")[0];
      };

      const result = await addMonthlyNav({
        month_end_date: formatDate(data.month_end_date),
        total_nav: data.total_nav,
        monthly_return: data.monthly_return,
        management_fees: data.management_fees,
        aum_change: data.aum_change,
      });

      if (result.success) {
        toast({
          title: "NAV Added Successfully",
          description: `Added NAV data for ${formatDate(data.month_end_date)}`,
        });
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to add NAV",
          description: result.error?.message || "An unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error submitting NAV:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add NAV data. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Monthly NAV</DialogTitle>
          <DialogDescription>
            Enter the month-end NAV values to update the fund performance data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="month_end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Month End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                      placeholder="Select month end date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_nav"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total NAV ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter total NAV value"
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
              name="monthly_return"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Return (%) - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter monthly return percentage"
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
              name="management_fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Management Fees ($) - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter management fees"
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
              name="aum_change"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AUM Change ($) - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter AUM change"
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

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add NAV"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
