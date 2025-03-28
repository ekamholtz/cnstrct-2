
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableContainer } from '@/components/ui/table-container';

interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_intent_id: string;
  amount: number;
  status: string;
  payment_method: string;
  error_message?: string;
  created_at: string;
}

interface PaymentHistoryTabProps {
  paymentRecords: PaymentRecord[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function PaymentHistoryTab({ 
  paymentRecords, 
  formatCurrency, 
  formatDate 
}: PaymentHistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your payment transaction history</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentRecords.length === 0 ? (
          <Alert variant="warning" className="bg-amber-50">
            <AlertTitle>No Payments Found</AlertTitle>
            <AlertDescription>
              No payment records found. When you start receiving payments, they will appear here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-md">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.created_at)}</TableCell>
                      <TableCell>{record.invoice_id}</TableCell>
                      <TableCell>{formatCurrency(record.amount)}</TableCell>
                      <TableCell>
                        {record.payment_method.charAt(0).toUpperCase() + record.payment_method.slice(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'succeeded' ? 'default' : 
                          record.status === 'failed' ? 'destructive' : 
                          'secondary'
                        } className={
                          record.status === 'succeeded' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                          record.status === 'failed' ? 'bg-red-100 text-red-800 hover:bg-red-100' : 
                          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
