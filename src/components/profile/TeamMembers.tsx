
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/components/admin/users/types";

export function TeamMembers() {
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`company_id.eq.${user.id},id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  if (isLoading) {
    return <div>Loading team members...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers?.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{member.full_name}</div>
                  <div className="text-sm text-gray-500">{member.phone_number}</div>
                </div>
              </TableCell>
              <TableCell className="capitalize">{member.role}</TableCell>
              <TableCell>
                <Badge variant={member.invitation_status === 'accepted' ? 'default' : 'secondary'}>
                  {member.invitation_status || 'accepted'}
                </Badge>
              </TableCell>
              <TableCell>
                {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
