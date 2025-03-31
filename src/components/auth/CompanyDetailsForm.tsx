
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  companyDetailsSchema,
  CompanyDetailsFormData,
} from "./authSchemas";

interface CompanyDetailsFormProps {
  onSubmit: (data: CompanyDetailsFormData) => void;
  loading: boolean;
  companyName: string;
}

export const CompanyDetailsForm = ({
  onSubmit,
  loading,
  companyName,
}: CompanyDetailsFormProps) => {
  const form = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      website: "",
      licenseNumber: "",
      address: "",
      phoneNumber: "",
    },
  });

  const handleSubmit = (data: CompanyDetailsFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="License Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Office Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, City, State, Zip" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Continue to Subscription"}
        </Button>
      </form>
    </Form>
  );
};
