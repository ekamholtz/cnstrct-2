
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clipboard, ExternalLink } from 'lucide-react';

interface PaymentLinkDisplayProps {
  link: string;
  onReset: () => void;
}

export function PaymentLinkDisplay({ link, onReset }: PaymentLinkDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const linkRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (linkRef.current) {
      linkRef.current.select();
      document.execCommand('copy');
      // For modern browsers
      navigator.clipboard.writeText(link).catch(err => console.error('Could not copy text: ', err));
      
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Payment link copied to clipboard'
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpen = () => {
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Payment Link Created</h3>
      
      <div className="flex items-center gap-2">
        <input
          ref={linkRef}
          value={link}
          readOnly
          className="flex-1 py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleOpen}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="pt-2">
        <Button variant="outline" onClick={onReset} className="w-full">
          Create New Link
        </Button>
      </div>
    </div>
  );
}
