import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const UserSearch = ({ searchQuery, setSearchQuery }: UserSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search team members..."
        className="pl-10 border-gray-200 focus-visible:ring-cnstrct-navy/20 rounded-md h-10"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
    </div>
  );
};
