
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Clients() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Clients</h1>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Client list will be displayed here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
