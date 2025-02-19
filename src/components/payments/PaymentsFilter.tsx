
import { DateRange } from "react-day-picker";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PaymentFilters, PaymentType } from "./types";

interface PaymentsFilterProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
}

export function PaymentsFilter({ filters, onFiltersChange }: PaymentsFilterProps) {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handlePaymentTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paymentType: value === "all" ? undefined : value as PaymentType
    });
  };

  const handleProjectChange = (value: string) => {
    onFiltersChange({
      ...filters,
      projectId: value === "all" ? undefined : value
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !filters.dateRange && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                  {format(filters.dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(filters.dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={filters.dateRange}
            onSelect={(range: DateRange | undefined) => 
              onFiltersChange({ ...filters, dateRange: range || { from: undefined, to: undefined } })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.paymentType || "all"}
        onValueChange={handlePaymentTypeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="cc">Credit Card</SelectItem>
          <SelectItem value="check">Check</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.projectId || "all"}
        onValueChange={handleProjectChange}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects?.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        onClick={() => onFiltersChange({
          dateRange: { from: undefined, to: undefined },
          paymentType: undefined,
          projectId: undefined,
        })}
      >
        Reset Filters
      </Button>
    </div>
  );
}
