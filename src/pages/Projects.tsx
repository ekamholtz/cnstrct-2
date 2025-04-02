
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Projects() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Projects page mounted");
    try {
      // Simulate data loading
      setTimeout(() => {
        setIsLoading(false);
        console.log("Projects data loaded");
      }, 1000);
    } catch (err) {
      console.error("Error in Projects page:", err);
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }

    return () => {
      console.log("Projects page unmounted");
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Projects</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg font-medium mb-2">Projects Page (Debug)</p>
            <p className="text-muted-foreground mb-4">This is a placeholder for the Projects page.</p>
            <p className="text-sm bg-yellow-50 p-4 rounded-md inline-block">
              Looking for <strong>DashboardLayout</strong> with header and sidebar? If this text is visible but not the layout, there might be a rendering issue with the layout component.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
