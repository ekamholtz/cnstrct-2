
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
import { PaymentFilters, PaymentDirection, PaymentProcessingStatus, PaymentMethodCode } from "./types";

interface PaymentsFilterProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
}

export function PaymentsFilter({ filters, onFiltersChange }: PaymentsFilterProps) {
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supported_payment_methods')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

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

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select
        value={filters.direction || "all"}
        onValueChange={(value) => 
          onFiltersChange({
            ...filters,
            direction: value === "all" ? undefined : value as PaymentDirection
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Directions</SelectItem>
          <SelectItem value="incoming">Incoming</SelectItem>
          <SelectItem value="outgoing">Outgoing</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) => 
          onFiltersChange({
            ...filters,
            status: value === "all" ? undefined : value as PaymentProcessingStatus
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.paymentMethodCode || "all"}
        onValueChange={(value) => 
          onFiltersChange({
            ...filters,
            paymentMethodCode: value === "all" ? undefined : value as PaymentMethodCode
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          {paymentMethods?.map((method) => (
            <SelectItem key={method.code} value={method.code}>
              {method.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
              onFiltersChange({
                ...filters,
                dateRange: range || { from: undefined, to: undefined }
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={filters.projectId || "all"}
        onValueChange={(value) => 
          onFiltersChange({
            ...filters,
            projectId: value === "all" ? undefined : value
          })
        }
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
          direction: undefined,
          status: undefined,
          paymentMethodCode: undefined,
          projectId: undefined,
        })}
      >
        Reset Filters
      </Button>
    </div>
  );
}
