
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { CreateUserFormValues } from "./types";
import { useCurrentUserProfile } from "./hooks/useCurrentUserProfile";
import { UserPlus, AlertCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(5, { message: "Please enter a valid phone number" }),
  role: z.enum(["gc_admin", "project_manager"], {
    message: "Please select a valid role",
  }),
});

interface InviteUserFormProps {
  onSubmit: (values: CreateUserFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const InviteUserForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: InviteUserFormProps) => {
  const { isOwner } = useCurrentUserProfile();
  
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "project_manager",
    },
  });

  const selectedRole = form.watch("role");
  const showAdminNotice = selectedRole === "gc_admin";

  return (
    <Card className="shadow-premium border border-gray-200/60">
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-cnstrct-navy flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-cnstrct-orange" />
          Invite New Team Member
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field} 
                      className="border-gray-200 focus-visible:ring-cnstrct-navy/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      {...field} 
                      className="border-gray-200 focus-visible:ring-cnstrct-navy/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(555) 123-4567" 
                      {...field} 
                      className="border-gray-200 focus-visible:ring-cnstrct-navy/20"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-200 focus:ring-cnstrct-navy/20">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isOwner && (
                        <SelectItem value="gc_admin">GC Admin</SelectItem>
                      )}
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            {showAdminNotice && isOwner && (
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Admin Privileges Notice</p>
                  <p>GC Admins will have access to all company projects and financial information. 
                  They can manage projects but only the owner can add new GC Admins or transfer ownership.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isLoading}
              className="border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-cnstrct-navy hover:bg-cnstrct-navy/90 text-white"
            >
              {isLoading ? "Inviting..." : "Invite User"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
