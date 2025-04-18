
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerSchema, type RegisterFormData } from "./authSchemas";
import { User, Mail, Lock, ShieldCheck, Building } from "lucide-react";
import { useState, useEffect } from "react";

interface RegisterFormProps {
  onSubmit: (values: RegisterFormData) => Promise<void>;
  loading: boolean;
  selectedRole: "gc_admin" | "homeowner";
}

export const RegisterForm = ({ onSubmit, loading, selectedRole }: RegisterFormProps) => {
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      role: selectedRole,
    },
    mode: "all"
  });

  // Update the role when the selectedRole prop changes
  useEffect(() => {
    form.setValue("role", selectedRole);
  }, [selectedRole, form]);

  const handleSubmit = async (values: RegisterFormData) => {
    setSubmitAttempted(true);
    
    // Make sure the role is set to the selected role before submission
    const formData = {
      ...values,
      role: selectedRole
    };
    
    console.log("Form submitted with values:", formData);
    await onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input 
                      placeholder="John" 
                      {...field} 
                      className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange" 
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input 
                      placeholder="Doe" 
                      {...field} 
                      className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange" 
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Company Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    placeholder="Your Construction Company" 
                    {...field} 
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange" 
                  />
                </div>
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
              <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        {/* Hidden field to ensure the role is captured */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <input type="hidden" {...field} value={selectedRole} />
          )}
        />

        {submitAttempted && loading && (
          <div className="text-center py-2">
            <p className="text-sm text-blue-600">Processing registration...</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 hover:from-cnstrct-orange/90 hover:to-cnstrct-orange text-white py-6 rounded-xl mt-6 font-medium text-base shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
};
