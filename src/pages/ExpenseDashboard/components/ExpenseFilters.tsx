
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter } from "@/components/shared/filters/DateRangeFilter";
import { ProjectFilter } from "@/components/shared/filters/ProjectFilter";
import type { ExpenseFilters, ExpenseStatus, ExpenseType } from "../hooks/useExpenseDashboard";

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFilters({ filters, onFiltersChange }: ExpenseFiltersProps) {
  return (
    <Card className="p-6 shadow-sm border-0">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={filters.expenseType}
          onValueChange={(value: ExpenseType) => 
            onFiltersChange({ ...filters, expenseType: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Expense Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="labor">Labor</SelectItem>
            <SelectItem value="materials">Materials</SelectItem>
            <SelectItem value="subcontractor">Subcontractor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value: ExpenseStatus) => 
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="due">Due</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <DateRangeFilter
          dateRange={filters.dateRange}
          onDateRangeChange={(range) => 
            onFiltersChange({ ...filters, dateRange: range })
          }
        />

        <ProjectFilter
          value={filters.projectId}
          onChange={(value) => 
            onFiltersChange({ ...filters, projectId: value })
          }
        />

        <Button
          variant="ghost"
          onClick={() => onFiltersChange({
            dateRange: undefined,
            status: "all",
            projectId: "all",
            expenseType: "all"
          })}
        >
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}
