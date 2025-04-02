
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function QBOCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');
    
    if (code && realmId) {
      setStatus('Authorization successful! Processing token exchange...');
      
      // In a real implementation, this would handle the OAuth callback
      setTimeout(() => {
        setStatus('Token exchange complete! Redirecting...');
        setTimeout(() => {
          navigate('/settings');
        }, 1000);
      }, 2000);
    } else {
      setStatus('Error: Missing required parameters');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">QBO Authentication</h1>
        <div className="mt-4 flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 border-2 border-t-blue-500 rounded-full"></div>
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
}
