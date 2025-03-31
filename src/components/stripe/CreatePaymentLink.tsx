
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface CreatePaymentLinkProps {
  onLinkCreated: (link: string) => void;
  projectId?: string;
}

export function CreatePaymentLink({ onLinkCreated, projectId }: CreatePaymentLinkProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateLink = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid amount',
          description: 'Please enter a valid amount greater than 0'
        });
        return;
      }
      
      // Mock creating a payment link
      // In a real app, this would call your server to create a Stripe payment link
      setTimeout(() => {
        const mockLink = `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substring(2, 15)}`;
        onLinkCreated(mockLink);
        setAmount('');
        setDescription('');
        toast({
          title: 'Payment link created',
          description: 'Your payment link has been created successfully'
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create payment link. Please try again.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount ($)
        </label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          min="0"
          step="0.01"
          className="w-full"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          className="w-full"
        />
      </div>
      
      <Button 
        onClick={handleCreateLink} 
        disabled={loading || !amount}
        className="w-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Payment Link
      </Button>
    </div>
  );
}
