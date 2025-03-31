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
import { companyDetailsSchema, type CompanyDetailsFormData } from "./authSchemas";
import { Globe, FileText, MapPin, Phone } from "lucide-react";

interface CompanyDetailsFormProps {
  onSubmit: (values: CompanyDetailsFormData) => Promise<void>;
  loading: boolean;
  companyName: string;
}

export const CompanyDetailsForm = ({ onSubmit, loading, companyName }: CompanyDetailsFormProps) => {
  const form = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      website: "",
      licenseNumber: "",
      address: "",
      phoneNumber: "",
    },
    mode: "all"
  });

  const handleSubmit = async (values: CompanyDetailsFormData) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Company Details</h2>
        <p className="text-gray-600">Tell us more about {companyName}</p>
      </div>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Company Website (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    placeholder="https://yourcompany.com" 
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
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">License Number (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    placeholder="License #" 
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Office Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    placeholder="123 Main St, City, State Zip" 
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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Office Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 hover:from-cnstrct-orange/90 hover:to-cnstrct-orange text-white py-6 rounded-xl mt-6 font-medium text-base shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue to Subscription"}
        </Button>
      </form>
    </Form>
  );
};
