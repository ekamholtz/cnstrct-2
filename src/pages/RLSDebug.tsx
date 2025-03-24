import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function RLSDebug() {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [tableRLS, setTableRLS] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectCreationResult, setProjectCreationResult] = useState<any>(null);

  // Add a log function that displays in the UI
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Get the current user on load
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        addLog(`Error getting current user: ${error.message}`);
        return;
      }
      
      if (data.user) {
        setUser(data.user);
        addLog(`Current user: ${data.user.id} (${data.user.email})`);
      } else {
        addLog("No authenticated user found");
      }
    };
    
    getCurrentUser();
  }, []);

  // Test database connection and RLS
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      addLog("Testing database connection...");
      
      // Test basic connection
      const { data: version, error: versionError } = await supabase
        .rpc('get_pg_version');
        
      if (versionError) {
        addLog(`Error getting database version: ${versionError.message}`);
        throw versionError;
      }
      
      addLog(`Database connection successful: ${version}`);
      
      // Test user role
      const { data: role, error: roleError } = await supabase
        .rpc('get_my_claims');
        
      if (roleError) {
        addLog(`Error getting user role: ${roleError.message}`);
      } else {
        addLog(`User claims: ${JSON.stringify(role)}`);
        if (role?.roles) {
          setRoles(Array.isArray(role.roles) ? role.roles : [role.roles]);
        }
      }
      
      // Try to get RLS info for tables
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');
        
      if (tablesError) {
        addLog(`Error getting tables: ${tablesError.message}`);
      } else {
        addLog(`Found ${tables?.length || 0} tables in public schema`);
        
        // Try to get RLS policies
        const { data: policies, error: policiesError } = await supabase
          .from('pg_policies')
          .select('*');
          
        if (policiesError) {
          addLog(`Error getting RLS policies: ${policiesError.message}`);
        } else {
          addLog(`Found ${policies?.length || 0} RLS policies`);
          setTableRLS(policies || []);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error testing connection: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Test project creation directly
  const testProjectCreation = async () => {
    setLoading(true);
    setError(null);
    setProjectCreationResult(null);
    
    try {
      addLog("Testing project creation...");
      
      // Get the client ID for the current user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (clientError) {
        addLog(`Error getting client: ${clientError.message}`);
        throw new Error(`Unable to find client for user ${user?.id}: ${clientError.message}`);
      }
      
      const clientId = client.id;
      addLog(`Using client ID: ${clientId}`);
      
      // Try creating a test project
      const testProject = {
        name: 'Test Project via Debug',
        description: 'Created via RLS Debug page',
        status: 'active',
        client_id: clientId,
        created_at: new Date().toISOString()
      };
      
      addLog(`Attempting to create project: ${JSON.stringify(testProject)}`);
      
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert(testProject)
        .select();
        
      if (createError) {
        addLog(`Error creating project: ${createError.message}`);
        throw createError;
      }
      
      addLog(`Project created successfully: ${JSON.stringify(newProject)}`);
      setProjectCreationResult(newProject);
      
      // Create a milestone
      if (newProject && newProject.length > 0) {
        const milestone = {
          name: 'Debug Milestone',
          amount: 1000,
          status: 'pending',
          project_id: newProject[0].id,
          created_at: new Date().toISOString()
        };
        
        addLog(`Creating milestone: ${JSON.stringify(milestone)}`);
        
        const { error: milestoneError } = await supabase
          .from('milestones')
          .insert(milestone);
          
        if (milestoneError) {
          addLog(`Error creating milestone: ${milestoneError.message}`);
        } else {
          addLog('Milestone created successfully');
        }
      }
      
      // Verify project exists
      const { data: verifyProject, error: verifyError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', newProject?.[0]?.id || '');
        
      if (verifyError) {
        addLog(`Error verifying project: ${verifyError.message}`);
      } else {
        addLog(`Verification result: ${JSON.stringify(verifyProject)}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error testing project creation: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Test RLS bypass with service role
  const testServiceRoleQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      addLog("Testing direct database query (bypassing RLS)...");
      addLog("Note: This requires proper server-side implementation");
      
      // This is just a mock to show what would happen
      // In a real implementation, this would make a server-side API call
      // that uses the service_role key to bypass RLS
      
      // Simulate a server-side call
      setTimeout(() => {
        addLog("Server would use service_role key to bypass RLS");
        addLog("This is a mock response - implement a real server endpoint for this");
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error testing service role query: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Row Level Security (RLS) Debug</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Roles:</strong> {roles.length > 0 ? roles.join(', ') : 'No roles found'}</p>
            </div>
          ) : (
            <p>No authenticated user</p>
          )}
          <div className="mt-4">
            <Button onClick={testConnection} disabled={loading}>
              Test Database Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>RLS Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {tableRLS.length > 0 ? (
            <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(tableRLS, null, 2)}
              </pre>
            </div>
          ) : (
            <p>No RLS policies found or not queried yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Project Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={testProjectCreation} disabled={loading || !user}>
              Create Test Project
            </Button>
            <Button 
              onClick={testServiceRoleQuery} 
              disabled={loading}
              variant="outline"
              className="ml-2"
            >
              Test Service Role Query (Mock)
            </Button>
          </div>
          
          {projectCreationResult && (
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="font-bold mb-2">Creation Result:</h3>
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(projectCreationResult, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
