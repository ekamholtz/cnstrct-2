
import React from "react";

export function QBOSyncInformation() {
  return (
    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
      <h3 className="font-semibold text-blue-800 mb-2">Syncing Information</h3>
      <p className="text-blue-700 text-sm">
        Data is synced one-way from CNSTRCT to QuickBooks Online:
      </p>
      <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
        <li>Clients are synced as Customers</li>
        <li>Expenses are synced as Bills</li>
        <li>Expense payments are synced as Bill Payments</li>
        <li>Invoices are synced as Invoices</li>
        <li>Invoice payments are synced as Payments</li>
        <li>Projects are tagged in QBO transactions</li>
      </ul>
    </div>
  );
}
