import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getClientProjects } from "@/mocks/clientApi";
import axios from "axios";

export default function ClientProjectsDebug() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [directProjects, setDirectProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log function that displays in the UI
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        addLog(`Error getting user: ${error.message}`);
        return;
      }
      setCurrentUser(data.user);
      addLog(`Current user: ${data.user?.email} (${data.user?.id})`);
    };

    fetchCurrentUser();
  }, []);

  const testClientLookup = async () => {
    setLoading(true);
    setError(null);
    setClientData(null);
    setClientProjects([]);
    setDirectProjects([]);
    setLogs([]);

    try {
      if (!currentUser) {
        setError("No authenticated user found");
        setLoading(false);
        return;
      }

      addLog(`Looking up client for user: ${currentUser.email}`);

      // First try to find by user_id
      const { data: clientByUserId, error: userIdError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (userIdError) {
        addLog(`No client found by user_id: ${userIdError.message}`);
        
        // Try to find by email
        const { data: clientByEmail, error: emailError } = await supabase
          .from('clients')
          .select('*')
          .ilike('email', currentUser.email)
          .single();

        if (emailError) {
          addLog(`No client found by email: ${emailError.message}`);
          
          // Try broader search
          const { data: clientsByPartialEmail, error: partialError } = await supabase
            .from('clients')
            .select('*')
            .ilike('email', `%${currentUser.email}%`);

          if (partialError) {
            addLog(`Error in partial email search: ${partialError.message}`);
          } else if (clientsByPartialEmail && clientsByPartialEmail.length > 0) {
            addLog(`Found ${clientsByPartialEmail.length} clients with similar email`);
            setClientData(clientsByPartialEmail[0]);
          } else {
            addLog('No clients found with similar email');
          }
        } else {
          addLog(`Found client by email: ${clientByEmail.id}`);
          setClientData(clientByEmail);
        }
      } else {
        addLog(`Found client by user_id: ${clientByUserId.id}`);
        setClientData(clientByUserId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addLog(`Error in client lookup: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectProjectQuery = async () => {
    if (!clientData) {
      addLog('No client data available for project query');
      return;
    }

    setLoading(true);
    try {
      addLog(`Querying projects directly for client ID: ${clientData.id}`);
      
      // Simple direct query
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientData.id);

      if (error) {
        addLog(`Error querying projects: ${error.message}`);
      } else {
        addLog(`Found ${projects?.length || 0} projects directly`);
        setDirectProjects(projects || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error in direct project query: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testClientProjectsApi = async () => {
    setLoading(true);
    try {
      addLog('Testing getClientProjects function directly');
      const projects = await getClientProjects();
      addLog(`getClientProjects returned ${projects?.length || 0} projects`);
      setClientProjects(projects || []);

      addLog('Testing mock API endpoint');
      try {
        const response = await axios.get('/api/client/projects');
        addLog(`API returned ${response.data?.length || 0} projects`);
      } catch (apiError) {
        addLog(`API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error in client projects API test: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const linkClientToUser = async () => {
    if (!clientData || !currentUser) {
      addLog('Need both client data and current user to link');
      return;
    }

    setLoading(true);
    try {
      addLog(`Linking client ${clientData.id} to user ${currentUser.id}`);
      
      const { error } = await supabase
        .from('clients')
        .update({ user_id: currentUser.id })
        .eq('id', clientData.id);

      if (error) {
        addLog(`Error linking client to user: ${error.message}`);
      } else {
        addLog('Successfully linked client to user');
        // Refresh client data
        const { data: refreshedClient } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientData.id)
          .single();
          
        setClientData(refreshedClient);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error linking client to user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Client Projects Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>ID:</strong> {currentUser.id}</p>
              </div>
            ) : (
              <p>No authenticated user found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Data</CardTitle>
          </CardHeader>
          <CardContent>
            {clientData ? (
              <div>
                <p><strong>Name:</strong> {clientData.name}</p>
                <p><strong>Email:</strong> {clientData.email}</p>
                <p><strong>ID:</strong> {clientData.id}</p>
                <p><strong>User ID:</strong> {clientData.user_id || 'Not linked'}</p>
                {clientData.user_id !== currentUser?.id && (
                  <Button 
                    onClick={linkClientToUser}
                    disabled={loading}
                    className="mt-2"
                  >
                    Link to Current User
                  </Button>
                )}
              </div>
            ) : (
              <p>No client data found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={testClientLookup} disabled={loading}>
                Test Client Lookup
              </Button>
              <Button onClick={testDirectProjectQuery} disabled={loading || !clientData}>
                Test Direct Project Query
              </Button>
              <Button onClick={testClientProjectsApi} disabled={loading}>
                Test Client Projects API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Direct Projects ({directProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {directProjects.length > 0 ? (
              <ul className="space-y-2">
                {directProjects.map(project => (
                  <li key={project.id} className="border p-3 rounded">
                    <p><strong>Name:</strong> {project.name}</p>
                    <p><strong>ID:</strong> {project.id}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No projects found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Projects ({clientProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientProjects.length > 0 ? (
              <ul className="space-y-2">
                {clientProjects.map(project => (
                  <li key={project.id} className="border p-3 rounded">
                    <p><strong>Name:</strong> {project.name}</p>
                    <p><strong>ID:</strong> {project.id}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No projects found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
            {logs.length > 0 ? (
              <ul className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            ) : (
              <p>No logs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
