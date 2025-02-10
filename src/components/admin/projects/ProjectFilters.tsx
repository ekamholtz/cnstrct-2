
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

interface ProjectFiltersProps {
  statusFilter: ProjectStatus | 'all';
  onStatusChange: (value: ProjectStatus | 'all') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateSort: 'asc' | 'desc';
  onDateSortChange: (value: 'asc' | 'desc') => void;
}

export function ProjectFilters({
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearchChange,
  dateSort,
  onDateSortChange,
}: ProjectFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Projects</Label>
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by project name or address..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Label>Sort by Date</Label>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onDateSortChange(dateSort === 'asc' ? 'desc' : 'asc')}
          >
            {dateSort === 'asc' ? (
              <SortAsc className="mr-2 h-4 w-4" />
            ) : (
              <SortDesc className="mr-2 h-4 w-4" />
            )}
            {dateSort === 'asc' ? 'Oldest First' : 'Newest First'}
          </Button>
        </div>
      </div>
    </div>
  );
}
