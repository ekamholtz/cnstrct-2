
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CheckoutCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const CheckoutCard: React.FC<CheckoutCardProps> = ({
  title,
  description,
  children
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        {children}
      </CardContent>
    </Card>
  );
};
