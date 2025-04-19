
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CheckoutCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function CheckoutCard({ title, description, children }: CheckoutCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
