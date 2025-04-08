
import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { CompanyDetailsForm } from '@/components/auth/CompanyDetailsForm';
import { CompanyDetailsFormData } from '@/components/auth/authSchemas';

export default function CompanyDetailsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Extract company name and user name from user metadata if available
  useEffect(() => {
    if (user?.user_metadata) {
      setCompanyName(user.user_metadata.company_name || '');
      setFirstName(user.user_metadata.first_name || '');
      setLastName(user.user_metadata.last_name || '');
    }
  }, [user]);

  const handleSubmit = async (formData: CompanyDetailsFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to update company details.",
      });
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a new GC account
      const { data: gcAccount, error: gcError } = await supabase
        .from('gc_accounts')
        .insert([
          {
            company_name: companyName || 'My Company',
            owner_id: user.id,
            website: formData.website,
            license_number: formData.licenseNumber,
            address: formData.address,
            phone_number: formData.phoneNumber
          }
        ])
        .select()
        .single();
      
      if (gcError) {
        throw new Error(gcError.message);
      }
      
      // Update the user's profile with the GC account ID and personal info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          gc_account_id: gcAccount.id,
          address: formData.address,
          phone_number: formData.phoneNumber,
          full_name: `${firstName} ${lastName}`.trim(),
          has_completed_profile: true
        })
        .eq('id', user.id);
      
      if (profileError) {
        throw new Error(profileError.message);
      }
      
      toast({
        title: "Success",
        description: "Company details have been saved successfully.",
      });
      
      // Redirect to subscription page
      navigate('/subscription-checkout');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save company details.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-cnstrct-navy">Company Details</CardTitle>
          <CardDescription>
            Please provide your company information to complete your account setup.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-cnstrct-navy" />
            </div>
          ) : (
            <CompanyDetailsForm 
              onSubmit={handleSubmit} 
              loading={loading}
              companyName={companyName}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
