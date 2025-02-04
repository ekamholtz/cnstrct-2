import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: 'pending' | 'in_progress' | 'completed';
}

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
}

export default function ProjectDashboard() {
  const { projectId } = useParams();
  const { toast } = useToast();
  
  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project;
    },
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Milestone[];
    },
  });

  const handleMarkComplete = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ status: 'completed' })
        .eq('id', milestoneId);

      if (error) throw error;

      toast({
        title: "Milestone Updated",
        description: "The milestone has been marked as complete.",
      });

      refetchMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone status.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (projectLoading || milestonesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project Not Found</h2>
            <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const calculateCompletion = () => {
    if (!milestones || milestones.length === 0) {
      console.log('No milestones found for project:', projectId);
      return 0;
    }

    const totalAmount = milestones.reduce((sum, milestone) => 
      sum + (milestone.amount || 0), 0);
    
    const completedAmount = milestones
      .filter(milestone => milestone.status === 'completed')
      .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

    console.log('Project completion calculation:', {
      projectId,
      totalAmount,
      completedAmount,
      percentage: totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0
    });

    return totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>

        {/* Project Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center mt-2 text-gray-600">
                <Building2 className="h-4 w-4 mr-2" />
                <p>{project.address}</p>
              </div>
            </div>
            <Button onClick={() => toast({
              title: "Coming Soon",
              description: "Project editing will be available soon!",
            })}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project Details
            </Button>
          </div>

          {/* Project Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </div>
                  <span className="text-sm font-medium">{completionPercentage}% Complete</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milestones Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Milestones</h2>
          <div className="space-y-4">
            {milestones && milestones.length > 0 ? (
              milestones.map((milestone) => (
                <Card key={milestone.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                        {milestone.description && (
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                        )}
                        {milestone.amount && (
                          <p className="text-sm font-medium text-gray-900">
                            ${milestone.amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                          {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                        </span>
                        {milestone.status !== 'completed' && (
                          <Button
                            onClick={() => handleMarkComplete(milestone.id)}
                            variant="outline"
                          >
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-600">
                  No milestones found for this project.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
