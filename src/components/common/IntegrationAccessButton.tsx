import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, FileText, X } from 'lucide-react';

export function IntegrationAccessButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
      {isOpen && (
        <div className="flex flex-col space-y-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-gray-200 hover:bg-gray-50 flex items-center space-x-2 px-3 py-2 text-sm"
            onClick={() => navigate('/settings/PaymentSettings')}
          >
            <CreditCard className="h-4 w-4 text-cnstrct-orange" />
            <span>Stripe Connect</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-gray-200 hover:bg-gray-50 flex items-center space-x-2 px-3 py-2 text-sm"
            onClick={() => navigate('/qbo/connect')}
          >
            <FileText className="h-4 w-4 text-cnstrct-orange" />
            <span>QuickBooks Online</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-gray-200 hover:bg-gray-50 flex items-center space-x-2 px-3 py-2 text-sm"
            onClick={() => navigate('/integrations')}
          >
            <Settings className="h-4 w-4 text-cnstrct-orange" />
            <span>All Integrations</span>
          </Button>
        </div>
      )}
      
      <Button
        variant={isOpen ? "destructive" : "default"}
        size="icon"
        className={`rounded-full shadow-lg ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-cnstrct-navy hover:bg-cnstrct-navy/90'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Settings className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
