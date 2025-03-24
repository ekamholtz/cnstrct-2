import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function DirectSQLDebug() {
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM projects WHERE client_id = '95b6a19a-4000-4ef8-8df8-62043e6429e1'");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const clientId = "95b6a19a-4000-4ef8-8df8-62043e6429e1";

  // Add a log function that displays in the UI
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      addLog(`Executing SQL query: ${sqlQuery}`);
      
      // Direct query using Supabase
      try {
        addLog('Attempting direct query...');
        
        // Parse the SQL to determine the table
        const tableMatch = sqlQuery.match(/FROM\s+([^\s,;]+)/i);
        if (!tableMatch || !tableMatch[1]) {
          throw new Error('Could not determine table name from query');
        }
        
        const tableName = tableMatch[1].replace(/['"]/g, '');
        addLog(`Extracted table name: ${tableName}`);
        
        // Extract WHERE clause if it exists
        const whereMatch = sqlQuery.match(/WHERE\s+(.+)$/i);
        const whereClause = whereMatch ? whereMatch[1] : '';
        addLog(`Extracted WHERE clause: ${whereClause || 'none'}`);
        
        let query = supabase.from(tableName).select('*');
        
        // If there's a client_id filter, apply it
        if (whereClause.includes('client_id')) {
          const clientIdMatch = whereClause.match(/client_id\s*=\s*['"]([^'"]+)['"]/i);
          if (clientIdMatch && clientIdMatch[1]) {
            const clientId = clientIdMatch[1];
            addLog(`Extracted client_id: ${clientId}`);
            query = query.eq('client_id', clientId);
          }
        }
        
        const { data: directData, error: directError } = await query;
        
        if (directError) {
          addLog(`Error in direct query: ${directError.message}`);
          throw directError;
        }
        
        addLog(`Direct query returned ${directData?.length || 0} results`);
        setResults(directData || []);
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        addLog(`Query failed: ${errorMessage}`);
        setError(`Query failed: ${errorMessage}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check for projects with null client_id
  const checkOrphanedProjects = async () => {
    setLoading(true);
    try {
      addLog('Checking for orphaned projects (null client_id)...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('client_id', null);
        
      if (error) {
        addLog(`Error checking orphaned projects: ${error.message}`);
        setError(error.message);
      } else {
        addLog(`Found ${data?.length || 0} orphaned projects`);
        setResults(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check all projects
  const getAllProjects = async () => {
    setLoading(true);
    try {
      addLog('Fetching all projects...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(50);
        
      if (error) {
        addLog(`Error fetching all projects: ${error.message}`);
        setError(error.message);
      } else {
        addLog(`Found ${data?.length || 0} total projects`);
        setResults(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check all clients
  const getAllClients = async () => {
    setLoading(true);
    try {
      addLog('Fetching all clients...');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(50);
        
      if (error) {
        addLog(`Error fetching all clients: ${error.message}`);
        setError(error.message);
      } else {
        addLog(`Found ${data?.length || 0} total clients`);
        setResults(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fix client projects by assigning active projects to this client
  const fixClientProjects = async () => {
    setLoading(true);
    try {
      addLog(`Attempting to fix projects for client ID: ${clientId}`);
      
      // First, check if there are any active projects
      const { data: activeProjects, error: activeError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');
        
      if (activeError) {
        addLog(`Error fetching active projects: ${activeError.message}`);
        setError(activeError.message);
        return;
      }
      
      addLog(`Found ${activeProjects?.length || 0} active projects`);
      
      if (activeProjects && activeProjects.length > 0) {
        // Update all active projects to be associated with this client
        for (const project of activeProjects) {
          addLog(`Updating project ${project.id} to be associated with client ${clientId}`);
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ client_id: clientId })
            .eq('id', project.id);
            
          if (updateError) {
            addLog(`Error updating project ${project.id}: ${updateError.message}`);
          } else {
            addLog(`Successfully updated project ${project.id}`);
          }
        }
        
        // Check if the updates worked
        const { data: updatedProjects, error: checkError } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', clientId);
          
        if (checkError) {
          addLog(`Error checking updated projects: ${checkError.message}`);
        } else {
          addLog(`Now client has ${updatedProjects?.length || 0} projects`);
          setResults(updatedProjects || []);
        }
      } else {
        // If no active projects, try to create a test project
        addLog('No active projects found, creating a test project');
        
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name: 'Test Project',
            client_id: clientId,
            status: 'active',
            description: 'Test project created for debugging',
            created_at: new Date().toISOString()
          })
          .select();
          
        if (createError) {
          addLog(`Error creating test project: ${createError.message}`);
          setError(createError.message);
        } else {
          addLog(`Successfully created test project: ${newProject?.[0]?.id}`);
          setResults(newProject || []);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check projects for a specific client
  const checkClientProjects = async () => {
    setLoading(true);
    try {
      addLog(`Checking projects for client ID: ${clientId}`);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId);
        
      if (error) {
        addLog(`Error checking client projects: ${error.message}`);
        setError(error.message);
      } else {
        addLog(`Found ${data?.length || 0} projects for client`);
        setResults(data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Direct SQL Debug</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>SQL Query</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            className="mb-4 font-mono"
            rows={4}
          />
          <div className="flex flex-wrap gap-4">
            <Button onClick={executeQuery} disabled={loading}>
              Execute Query
            </Button>
            <Button onClick={checkOrphanedProjects} disabled={loading} variant="outline">
              Check Orphaned Projects
            </Button>
            <Button onClick={getAllProjects} disabled={loading} variant="outline">
              Get All Projects
            </Button>
            <Button onClick={getAllClients} disabled={loading} variant="outline">
              Get All Clients
            </Button>
            <Button onClick={checkClientProjects} disabled={loading} variant="outline">
              Check Client Projects
            </Button>
            <Button onClick={fixClientProjects} disabled={loading} variant="destructive">
              Fix Client Projects
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
            {results.length > 0 ? (
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            ) : (
              <p>No results</p>
            )}
          </div>
        </CardContent>
      </Card>

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
