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
import { ExpenseFilters as ExpenseFiltersType, ExpenseStatus, ExpenseType } from "../types";

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onFiltersChange: (filters: ExpenseFiltersType) => void;
}

export function ExpenseFilters({ filters, onFiltersChange }: ExpenseFiltersProps) {
  return (
    <Card 
      variant="glass" 
      className="shadow-md border border-white/20 backdrop-blur-sm p-6"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={filters.expenseType}
          onValueChange={(value: ExpenseType) => onFiltersChange({ ...filters, expenseType: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Expense Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="labor">Labor</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="subcontractor">Subcontractor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value: ExpenseStatus) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <DateRangeFilter
          dateRange={filters.dateRange}
          onDateRangeChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
        />

        <ProjectFilter
          value={filters.projectId}
          onChange={(value) => onFiltersChange({ ...filters, projectId: value })}
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
