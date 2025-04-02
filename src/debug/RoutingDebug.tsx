import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function RoutingDebug() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [routeHistory, setRouteHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add current location to history
    setRouteHistory(prev => [...prev, location.pathname]);
    
    // Log routing information
    console.log('RoutingDebug - Current location:', location);
    console.log('RoutingDebug - User authenticated:', !!user);
  }, [location, user]);

  const testRoutes = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/clients', label: 'Clients' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/settings', label: 'Settings' },
    { path: '/settings/payments', label: 'Payment Settings' }
  ];

  const handleTestNavigation = (path: string) => {
    try {
      console.log('RoutingDebug - Testing navigation to:', path);
      navigate(path);
    } catch (err) {
      console.error('RoutingDebug - Navigation error:', err);
      setError(`Failed to navigate to ${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Routing Debug Panel</CardTitle>
          <CardDescription>Use this panel to diagnose routing issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Location</h3>
            <code className="block p-2 bg-gray-100 rounded">{location.pathname}</code>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Authentication Status</h3>
            <div className={`p-2 rounded ${user ? 'bg-green-100' : 'bg-red-100'}`}>
              {user ? 'Authenticated' : 'Not Authenticated'}
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Navigation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Test Navigation</h3>
            <div className="flex flex-wrap gap-2">
              {testRoutes.map(route => (
                <Button 
                  key={route.path} 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestNavigation(route.path)}
                >
                  {route.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Route History</h3>
            <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 rounded">
              {routeHistory.map((route, index) => (
                <div key={index} className="text-xs mb-1">
                  {index + 1}. {route}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
