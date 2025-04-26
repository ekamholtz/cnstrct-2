
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

interface QBOErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface QBOErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class QBOErrorBoundary extends Component<QBOErrorBoundaryProps, QBOErrorBoundaryState> {
  constructor(props: QBOErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<QBOErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console or error reporting service
    console.error("QBO Integration Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // Clear localStorage values related to QBO
    if (typeof window !== 'undefined') {
      const qboKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('qbo_') || key.includes('qbo') || key.includes('quickbooks')
      );
      
      qboKeys.forEach(key => {
        console.log(`Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
      
      console.log('QBO localStorage data cleared');
    }
    
    // Reset state and reload page
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">QuickBooks Integration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-700 mb-4">
              <p>Something went wrong with the QuickBooks Online integration.</p>
              {this.state.error && (
                <div className="mt-2 p-2 bg-red-100 rounded-md">
                  <p className="font-mono text-xs">{this.state.error.toString()}</p>
                </div>
              )}
            </div>
            
            <details className="text-xs text-gray-500">
              <summary>Technical Details</summary>
              {this.state.errorInfo && (
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Integration
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://developer.intuit.com/app/developer/qbo/docs/develop/troubleshooting/oauth', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              QBO OAuth Docs
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}
