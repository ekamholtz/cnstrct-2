
import React from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Invoice() {
  const { id } = useParams();
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Invoice Details</h1>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Invoice ID: {id}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
