import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuthForm } from '@/hooks/useAuthForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function CompanyDetailsPage() {
  const { isLoading } = useAuthForm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to update company details.",
      });
      navigate('/auth');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create a new GC account
      const { data: gcAccount, error: gcError } = await supabase
        .from('gc_accounts')
        .insert([
          {
            company_name: formData.companyName,
            owner_id: user.id
          }
        ])
        .select()
        .single();
      
      if (gcError) {
        throw new Error(gcError.message);
      }
      
      // Update the user's profile with the GC account ID and address information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          gc_account_id: gcAccount.id,
          company_name: formData.companyName,
          address: formData.address,
          phone_number: formData.phoneNumber
        })
        .eq('id', user.id);
      
      if (profileError) {
        throw new Error(profileError.message);
      }
      
      toast({
        title: "Success",
        description: "Company details have been saved successfully.",
      });
      
      // Redirect to subscription page or dashboard
      navigate('/subscription-checkout');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save company details.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-cnstrct-navy">Company Details</CardTitle>
          <CardDescription>
            Please provide your company information to complete your account setup.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Your company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  placeholder="State"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  placeholder="ZIP Code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
            >
              Skip for Now
            </Button>
            
            <Button 
              type="submit"
              disabled={submitting || isLoading}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
