
import React from 'react';
import { QBOService } from '@/integrations/qbo/qboService';
import { QBOMappingService } from '@/integrations/qbo/mapping';

export default function QBOTest() {
  const qboService = new QBOService();
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">QuickBooks Online Integration Test</h1>
      
      <div className="space-y-4">
        <p>This page is for testing QBO integration functionality.</p>
        <div className="p-4 border rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Integration Status</h2>
          <p>Open the console to see test results.</p>
        </div>
      </div>
    </div>
  );
}
