import { useState, useEffect } from "react";
import { testSupabaseConnection } from "@/mocks/debug-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientProjects } from "@/mocks/clientApi";
import { supabase } from "@/integrations/supabase/client";

export default function DebugPage() {
  const [connectionResults, setConnectionResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [directQueryResults, setDirectQueryResults] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    
    checkUser();
  }, []);

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const results = await testSupabaseConnection();
      setConnectionResults(results);
    } catch (error) {
      console.error("Error running connection test:", error);
      setConnectionResults({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientProjects = async () => {
    setIsLoading(true);
    try {
      const projects = await getClientProjects();
      setClientProjects(projects);
    } catch (error) {
      console.error("Error fetching client projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runDirectQuery = async () => {
    setIsLoading(true);
    try {
      // Try a direct query to projects table
      const clientId = '95b6a19a-4000-4ef8-8df8-62043e6429e1'; // tc1@email.com client
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId);
      
      setDirectQueryResults({ data, error });
    } catch (error) {
      console.error("Error with direct query:", error);
      setDirectQueryResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>Information about the currently logged in user</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div>
              <p><strong>User ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Last Sign In:</strong> {new Date(currentUser.last_sign_in_at).toLocaleString()}</p>
            </div>
          ) : (
            <p>No user is currently logged in</p>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="connection">
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="clientProjects">Client Projects</TabsTrigger>
          <TabsTrigger value="directQuery">Direct Query</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection Test</CardTitle>
              <CardDescription>Test the connection to Supabase and query capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runConnectionTest} disabled={isLoading}>
                {isLoading ? "Testing..." : "Run Connection Test"}
              </Button>
              
              {connectionResults && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Results:</h3>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(connectionResults, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clientProjects">
          <Card>
            <CardHeader>
              <CardTitle>Client Projects Test</CardTitle>
              <CardDescription>Test fetching projects using the clientApi.getClientProjects function</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchClientProjects} disabled={isLoading}>
                {isLoading ? "Fetching..." : "Fetch Client Projects"}
              </Button>
              
              {clientProjects && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Found {clientProjects.length} projects:
                  </h3>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(clientProjects, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="directQuery">
          <Card>
            <CardHeader>
              <CardTitle>Direct Query Test</CardTitle>
              <CardDescription>Test querying the projects table directly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runDirectQuery} disabled={isLoading}>
                {isLoading ? "Querying..." : "Run Direct Query"}
              </Button>
              
              {directQueryResults && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Results:</h3>
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(directQueryResults, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
